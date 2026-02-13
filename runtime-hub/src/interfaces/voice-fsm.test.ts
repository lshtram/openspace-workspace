import { describe, expect, it } from 'vitest';
import {
  VoiceStateTransitionError,
  validateInputTransition,
  validateOutputTransition,
  validateTranscriptTransition,
} from './voice-fsm.js';

describe('voice input FSM', () => {
  it('accepts all legal transitions', () => {
    expect(validateInputTransition({ from: 'idle', trigger: 'startSession', policyValid: true })).toBe('listening');
    expect(validateInputTransition({ from: 'listening', trigger: 'stopCapture' })).toBe('processing');
    expect(validateInputTransition({ from: 'listening', trigger: 'interrupt', bargeInEnabled: true })).toBe(
      'interrupted',
    );
    expect(validateInputTransition({ from: 'processing', trigger: 'transcriptReady', parseSuccess: true })).toBe(
      'stopped',
    );
    expect(validateInputTransition({ from: 'processing', trigger: 'parseError', recoverable: true })).toBe(
      'listening',
    );
    expect(validateInputTransition({ from: 'interrupted', trigger: 'resumeCapture', bargeInEnabled: true })).toBe(
      'listening',
    );
    expect(validateInputTransition({ from: 'interrupted', trigger: 'stopSession' })).toBe('stopped');
    expect(validateInputTransition({ from: 'stopped', trigger: 'startSession', newSession: true })).toBe('listening');
  });

  it('rejects transitions with unmet conditions', () => {
    expect(() => validateInputTransition({ from: 'idle', trigger: 'startSession', policyValid: false })).toThrow(
      VoiceStateTransitionError,
    );
    expect(() =>
      validateInputTransition({ from: 'interrupted', trigger: 'resumeCapture', bargeInEnabled: false }),
    ).toThrow('barge-in must be enabled');
  });

  it('returns structured error details for illegal transition', () => {
    try {
      validateInputTransition({ from: 'idle', trigger: 'stopCapture' as never });
      throw new Error('expected transition error');
    } catch (error) {
      expect(error).toBeInstanceOf(VoiceStateTransitionError);
      const transitionError = error as VoiceStateTransitionError;
      expect(transitionError.code).toBe('VOICE_INVALID_TRANSITION');
      expect(transitionError.stateMachine).toBe('input');
      expect(transitionError.from).toBe('idle');
      expect(transitionError.trigger).toBe('stopCapture');
      expect(transitionError.allowed).toContainEqual({ trigger: 'startSession', to: 'listening' });
    }
  });
});

describe('voice transcript FSM', () => {
  it('accepts all legal transitions', () => {
    expect(validateTranscriptTransition({ from: 'empty', trigger: 'interimChunk', textPresent: true })).toBe('interim');
    expect(validateTranscriptTransition({ from: 'interim', trigger: 'interimChunk', textPresent: true })).toBe('interim');
    expect(validateTranscriptTransition({ from: 'interim', trigger: 'finalize', asrDone: true })).toBe('final');
    expect(
      validateTranscriptTransition({
        from: 'final',
        trigger: 'enableEdit',
        transcriptMode: 'edit-before-send',
      }),
    ).toBe('editable');
    expect(
      validateTranscriptTransition({
        from: 'final',
        trigger: 'autoSend',
        transcriptMode: 'automatic-send',
      }),
    ).toBe('sent');
    expect(validateTranscriptTransition({ from: 'editable', trigger: 'submit', userConfirmed: true })).toBe('sent');
    expect(validateTranscriptTransition({ from: 'editable', trigger: 'cancel', userCancelled: true })).toBe('final');
    expect(validateTranscriptTransition({ from: 'sent', trigger: 'newUtterance', sameSession: true })).toBe('interim');
  });

  it('rejects transcript mode mismatch and missing text chunks', () => {
    expect(() =>
      validateTranscriptTransition({ from: 'final', trigger: 'enableEdit', transcriptMode: 'automatic-send' }),
    ).toThrow('transcriptMode must be edit-before-send');

    expect(() => validateTranscriptTransition({ from: 'empty', trigger: 'interimChunk', textPresent: false })).toThrow(
      'interimChunk requires non-empty text',
    );
  });
});

describe('voice output FSM', () => {
  it('accepts all legal transitions', () => {
    expect(validateOutputTransition({ from: 'idle', trigger: 'enqueuePlan', outputAllowed: true })).toBe('queued');
    expect(validateOutputTransition({ from: 'queued', trigger: 'startPlayback', deviceReady: true })).toBe('speaking');
    expect(validateOutputTransition({ from: 'speaking', trigger: 'pause' })).toBe('paused');
    expect(validateOutputTransition({ from: 'paused', trigger: 'resume' })).toBe('speaking');
    expect(validateOutputTransition({ from: 'speaking', trigger: 'bargeIn', bargeInEnabled: true })).toBe(
      'interrupted',
    );
    expect(validateOutputTransition({ from: 'interrupted', trigger: 'resume', pendingSegments: true })).toBe('queued');
    expect(validateOutputTransition({ from: 'speaking', trigger: 'segmentDone', hasMoreSegments: true })).toBe('queued');
    expect(validateOutputTransition({ from: 'speaking', trigger: 'segmentDone', hasMoreSegments: false })).toBe(
      'completed',
    );
    expect(validateOutputTransition({ from: 'completed', trigger: 'enqueuePlan', outputAllowed: true })).toBe('queued');
  });

  it('rejects enqueue when output policy disallows speech', () => {
    expect(() => validateOutputTransition({ from: 'idle', trigger: 'enqueuePlan', outputAllowed: false })).toThrow(
      'output policy must allow speech',
    );
  });
});
