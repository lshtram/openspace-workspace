export type InputState = 'idle' | 'listening' | 'processing' | 'interrupted' | 'stopped';
export type TranscriptState = 'empty' | 'interim' | 'final' | 'editable' | 'sent';
export type OutputState = 'idle' | 'queued' | 'speaking' | 'paused' | 'interrupted' | 'completed';

export type InputTrigger =
  | 'startSession'
  | 'stopCapture'
  | 'interrupt'
  | 'transcriptReady'
  | 'parseError'
  | 'resumeCapture'
  | 'stopSession';
export type TranscriptTrigger =
  | 'interimChunk'
  | 'finalize'
  | 'enableEdit'
  | 'autoSend'
  | 'submit'
  | 'cancel'
  | 'newUtterance';
export type OutputTrigger =
  | 'enqueuePlan'
  | 'startPlayback'
  | 'pause'
  | 'resume'
  | 'bargeIn'
  | 'segmentDone';

type StateMachine = 'input' | 'transcript' | 'output';

export class VoiceStateTransitionError extends Error {
  code = 'VOICE_INVALID_TRANSITION';
  stateMachine: StateMachine;
  from: string;
  trigger: string;
  allowed: Array<{ trigger: string; to: string }>;

  constructor(args: {
    stateMachine: StateMachine;
    from: string;
    trigger: string;
    reason: string;
    allowed: Array<{ trigger: string; to: string }>;
  }) {
    super(args.reason);
    this.stateMachine = args.stateMachine;
    this.from = args.from;
    this.trigger = args.trigger;
    this.allowed = args.allowed;
  }
}

function failTransition(
  stateMachine: StateMachine,
  from: string,
  trigger: string,
  reason: string,
  allowed: Array<{ trigger: string; to: string }>,
): never {
  throw new VoiceStateTransitionError({ stateMachine, from, trigger, reason, allowed });
}

function inputAllowed(from: InputState): Array<{ trigger: string; to: string }> {
  switch (from) {
    case 'idle':
      return [{ trigger: 'startSession', to: 'listening' }];
    case 'listening':
      return [
        { trigger: 'stopCapture', to: 'processing' },
        { trigger: 'interrupt', to: 'interrupted' },
      ];
    case 'processing':
      return [
        { trigger: 'transcriptReady', to: 'stopped' },
        { trigger: 'parseError', to: 'listening' },
      ];
    case 'interrupted':
      return [
        { trigger: 'resumeCapture', to: 'listening' },
        { trigger: 'stopSession', to: 'stopped' },
      ];
    case 'stopped':
      return [{ trigger: 'startSession', to: 'listening' }];
  }
}

function transcriptAllowed(from: TranscriptState): Array<{ trigger: string; to: string }> {
  switch (from) {
    case 'empty':
      return [{ trigger: 'interimChunk', to: 'interim' }];
    case 'interim':
      return [
        { trigger: 'interimChunk', to: 'interim' },
        { trigger: 'finalize', to: 'final' },
      ];
    case 'final':
      return [
        { trigger: 'enableEdit', to: 'editable' },
        { trigger: 'autoSend', to: 'sent' },
      ];
    case 'editable':
      return [
        { trigger: 'submit', to: 'sent' },
        { trigger: 'cancel', to: 'final' },
      ];
    case 'sent':
      return [{ trigger: 'newUtterance', to: 'interim' }];
  }
}

function outputAllowed(from: OutputState): Array<{ trigger: string; to: string }> {
  switch (from) {
    case 'idle':
      return [{ trigger: 'enqueuePlan', to: 'queued' }];
    case 'queued':
      return [{ trigger: 'startPlayback', to: 'speaking' }];
    case 'speaking':
      return [
        { trigger: 'pause', to: 'paused' },
        { trigger: 'bargeIn', to: 'interrupted' },
        { trigger: 'segmentDone', to: 'queued|completed' },
      ];
    case 'paused':
      return [{ trigger: 'resume', to: 'speaking' }];
    case 'interrupted':
      return [{ trigger: 'resume', to: 'queued' }];
    case 'completed':
      return [{ trigger: 'enqueuePlan', to: 'queued' }];
  }
}

export interface InputTransitionRequest {
  from: InputState;
  trigger: InputTrigger;
  policyValid?: boolean;
  parseSuccess?: boolean;
  recoverable?: boolean;
  bargeInEnabled?: boolean;
  newSession?: boolean;
}

export interface TranscriptTransitionRequest {
  from: TranscriptState;
  trigger: TranscriptTrigger;
  textPresent?: boolean;
  asrDone?: boolean;
  transcriptMode?: 'edit-before-send' | 'automatic-send';
  userConfirmed?: boolean;
  userCancelled?: boolean;
  sameSession?: boolean;
}

export interface OutputTransitionRequest {
  from: OutputState;
  trigger: OutputTrigger;
  outputAllowed?: boolean;
  deviceReady?: boolean;
  bargeInEnabled?: boolean;
  pendingSegments?: boolean;
  hasMoreSegments?: boolean;
}

export function validateInputTransition(request: InputTransitionRequest): InputState {
  const { from, trigger } = request;

  switch (`${from}:${trigger}`) {
    case 'idle:startSession':
      if (request.policyValid) {
        return 'listening';
      }
      break;
    case 'listening:stopCapture':
      return 'processing';
    case 'listening:interrupt':
      if (request.bargeInEnabled) {
        return 'interrupted';
      }
      break;
    case 'processing:transcriptReady':
      if (request.parseSuccess) {
        return 'stopped';
      }
      break;
    case 'processing:parseError':
      if (request.recoverable) {
        return 'listening';
      }
      break;
    case 'interrupted:resumeCapture':
      if (request.bargeInEnabled) {
        return 'listening';
      }
      break;
    case 'interrupted:stopSession':
      return 'stopped';
    case 'stopped:startSession':
      if (request.newSession) {
        return 'listening';
      }
      break;
    default:
      break;
  }

  if (from === 'interrupted' && trigger === 'resumeCapture') {
    failTransition('input', from, trigger, 'barge-in must be enabled', inputAllowed(from));
  }

  failTransition('input', from, trigger, 'invalid input state transition', inputAllowed(from));
}

export function validateTranscriptTransition(request: TranscriptTransitionRequest): TranscriptState {
  const { from, trigger } = request;

  switch (`${from}:${trigger}`) {
    case 'empty:interimChunk':
    case 'interim:interimChunk':
      if (request.textPresent) {
        return 'interim';
      }
      return failTransition('transcript', from, trigger, 'interimChunk requires non-empty text', transcriptAllowed(from));
    case 'interim:finalize':
      if (request.asrDone) {
        return 'final';
      }
      break;
    case 'final:enableEdit':
      if (request.transcriptMode === 'edit-before-send') {
        return 'editable';
      }
      return failTransition(
        'transcript',
        from,
        trigger,
        'transcriptMode must be edit-before-send',
        transcriptAllowed(from),
      );
    case 'final:autoSend':
      if (request.transcriptMode === 'automatic-send') {
        return 'sent';
      }
      break;
    case 'editable:submit':
      if (request.userConfirmed) {
        return 'sent';
      }
      break;
    case 'editable:cancel':
      if (request.userCancelled) {
        return 'final';
      }
      break;
    case 'sent:newUtterance':
      if (request.sameSession) {
        return 'interim';
      }
      break;
    default:
      break;
  }

  failTransition('transcript', from, trigger, 'invalid transcript state transition', transcriptAllowed(from));
}

export function validateOutputTransition(request: OutputTransitionRequest): OutputState {
  const { from, trigger } = request;

  switch (`${from}:${trigger}`) {
    case 'idle:enqueuePlan':
    case 'completed:enqueuePlan':
      if (request.outputAllowed) {
        return 'queued';
      }
      return failTransition('output', from, trigger, 'output policy must allow speech', outputAllowed(from));
    case 'queued:startPlayback':
      if (request.deviceReady) {
        return 'speaking';
      }
      break;
    case 'speaking:pause':
      return 'paused';
    case 'paused:resume':
      return 'speaking';
    case 'speaking:bargeIn':
      if (request.bargeInEnabled) {
        return 'interrupted';
      }
      break;
    case 'interrupted:resume':
      if (request.pendingSegments) {
        return 'queued';
      }
      break;
    case 'speaking:segmentDone':
      if (request.hasMoreSegments === true) {
        return 'queued';
      }

      if (request.hasMoreSegments === false) {
        return 'completed';
      }

      break;
    default:
      break;
  }

  failTransition('output', from, trigger, 'invalid output state transition', outputAllowed(from));
}
