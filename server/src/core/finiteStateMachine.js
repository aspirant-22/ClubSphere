/**
 * @FILE: finiteStateMachine.js
 * @RESPONSIBILITY: Finite State Machine lifecycle transition validator and audit lock enforcer.
 * @DEPENDENCIES: None (Pure lifecycle business logic).
 * @MODIFICATION_HOTSPOT: PERMITTED_STATE_TRANSITIONS graph definition.
 * @AUTHOR: Garima Mittal
 */

export const ERP_LIFECYCLE_STATES = {
  DRAFT: 'DRAFT',
  WAITING: 'WAITING',
  READY: 'READY',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED'
};

const PERMITTED_STATE_TRANSITIONS = {
  [ERP_LIFECYCLE_STATES.DRAFT]: [
    ERP_LIFECYCLE_STATES.WAITING,
    ERP_LIFECYCLE_STATES.CANCELLED
  ],
  [ERP_LIFECYCLE_STATES.WAITING]: [
    ERP_LIFECYCLE_STATES.READY,
    ERP_LIFECYCLE_STATES.CANCELLED
  ],
  [ERP_LIFECYCLE_STATES.READY]: [
    ERP_LIFECYCLE_STATES.DONE,
    ERP_LIFECYCLE_STATES.CANCELLED
  ],
  [ERP_LIFECYCLE_STATES.DONE]: [], // Immutable audit lock: mutations strictly frozen
  [ERP_LIFECYCLE_STATES.CANCELLED]: [] // Terminal cancellation state
};

export class FsmStateTransitionError extends Error {
  constructor(errorMessage, currentLifecycleState, destinationLifecycleState) {
    super(errorMessage);
    this.name = 'FsmStateTransitionError';
    this.currentLifecycleState = currentLifecycleState;
    this.destinationLifecycleState = destinationLifecycleState;
  }
}

export const validateLifecycleStateTransition = (
  currentLifecycleState,
  destinationLifecycleState
) => {
  const normalizedCurrentState = currentLifecycleState ? currentLifecycleState.toUpperCase() : ERP_LIFECYCLE_STATES.DRAFT;
  const normalizedDestinationState = destinationLifecycleState ? destinationLifecycleState.toUpperCase() : null;

  if (normalizedCurrentState === ERP_LIFECYCLE_STATES.DONE) {
    console.error(`[FSM Violation]: Attempted mutation on frozen immutable record in state: ${normalizedCurrentState}`);
    throw new FsmStateTransitionError(
      'Immutable Audit Lock: Records in DONE state cannot undergo mutations or transitions.',
      normalizedCurrentState,
      normalizedDestinationState
    );
  }

  const validTargetStates = PERMITTED_STATE_TRANSITIONS[normalizedCurrentState] || [];
  const isTransitionAllowed = validTargetStates.includes(normalizedDestinationState);

  if (!isTransitionAllowed) {
    console.error(`[FSM Rejection]: Invalid state step from ${normalizedCurrentState} to ${normalizedDestinationState}`);
    throw new FsmStateTransitionError(
      `Illegal transition pathway: Cannot move from ${normalizedCurrentState} to ${normalizedDestinationState}.`,
      normalizedCurrentState,
      normalizedDestinationState
    );
  }

  console.log(`[FSM Accepted]: State transitioned from ${normalizedCurrentState} to ${normalizedDestinationState}`);
  return true;
};
