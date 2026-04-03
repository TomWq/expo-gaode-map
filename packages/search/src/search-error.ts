export type SearchErrorType =
  | 'validation_error'
  | 'native_error'
  | 'config_error';

export interface SearchUnifiedError {
  code: string;
  type: SearchErrorType;
  message: string;
  retryable: boolean;
  cause?: unknown;
}

export class GaodeSearchError
  extends Error
  implements SearchUnifiedError
{
  public readonly code: string;
  public readonly type: SearchErrorType;
  public readonly retryable: boolean;
  public readonly cause?: unknown;

  constructor(options: SearchUnifiedError) {
    super(options.message);
    this.name = 'GaodeSearchError';
    this.code = options.code;
    this.type = options.type;
    this.retryable = options.retryable;
    this.cause = options.cause;
    Object.setPrototypeOf(this, GaodeSearchError.prototype);
  }

  toJSON(): SearchUnifiedError {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      retryable: this.retryable,
      cause: this.cause,
    };
  }
}
