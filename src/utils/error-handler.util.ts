import { catchError } from 'rxjs';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  NotImplementedException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Maps a Stripe card error (decline) into a clear, client-safe message.
 *
 * When a card is declined — including a *valid* card blocked by Stripe Radar
 * for suspected fraud — Stripe throws a `StripeCardError` whose `decline_code`
 * / `code` tells us *why*. We translate the common codes into actionable
 * wording so the customer knows whether to retry, use another card, or call
 * their bank. Stripe deliberately keeps `fraudulent` / `generic_decline`
 * vague (to avoid helping real fraudsters probe), so we keep that wording
 * generic too.
 */
export function getStripeDeclineMessage(error: any): string {
  // Stripe surfaces the precise reason on decline_code; code is the fallback.
  const declineCode: string | undefined = error?.decline_code || error?.raw?.decline_code;
  const code: string | undefined = error?.code || error?.raw?.code;
  const key = declineCode || code;

  const messages: Record<string, string> = {
    fraudulent:
      'Your payment was declined by the card issuer for security reasons. Please contact your bank to authorize this purchase, or try a different card.',
    card_declined:
      'Your card was declined. Please contact your bank, or try a different card.',
    generic_decline:
      'Your card was declined. Please contact your bank to authorize this purchase, or try a different card.',
    do_not_honor:
      'Your card was declined by the issuing bank. Please contact your bank, or try a different card.',
    insufficient_funds:
      'Your card has insufficient funds. Please use a different card.',
    lost_card:
      'Your card was declined. Please contact your bank, or try a different card.',
    stolen_card:
      'Your card was declined. Please contact your bank, or try a different card.',
    expired_card:
      'Your card has expired. Please use a different card.',
    incorrect_cvc:
      'The security code (CVC) is incorrect. Please check it and try again.',
    invalid_cvc:
      'The security code (CVC) is invalid. Please check it and try again.',
    incorrect_number:
      'The card number is incorrect. Please check it and try again.',
    invalid_expiry_month:
      'The card expiry month is invalid. Please check it and try again.',
    invalid_expiry_year:
      'The card expiry year is invalid. Please check it and try again.',
    processing_error:
      'An error occurred while processing your card. Please try again in a moment.',
    card_velocity_exceeded:
      'Your card was declined for exceeding the allowed number of attempts. Please contact your bank, or try a different card.',
    currency_not_supported:
      'Your card does not support this currency. Please use a different card.',
    authentication_required:
      'This payment requires additional authentication. Please complete the verification with your bank and try again.',
  };

  if (key && messages[key]) {
    return messages[key];
  }

  // Any other Stripe card error: prefer Stripe's own human-readable message.
  if (error?.message) {
    return error.message;
  }

  return 'Your payment could not be processed. Please try again or use a different card.';
}

/**
 * Returns a NestJS exception for a Stripe error if (and only if) the error is a
 * Stripe error; otherwise returns null so the caller can fall through to its
 * existing handling. Card declines (incl. fraud blocks) become a 400 with a
 * clear, client-facing message.
 */
export function handleStripeError(error: any): HttpException | null {
  if (error instanceof Stripe.errors.StripeCardError) {
    return new BadRequestException(getStripeDeclineMessage(error));
  }
  if (error instanceof Stripe.errors.StripeError) {
    // Non-card Stripe errors (rate limit, connection, invalid request, etc.)
    return new BadRequestException(
      error?.message || 'Payment processing failed. Please try again.',
    );
  }
  return null;
}

export function handlePrismaError(error: any): HttpException {
  switch (error.code) {
    case 'P2000':
      return new HttpException('Database connector error', HttpStatus.INTERNAL_SERVER_ERROR);
    case 'P2001':
      return new HttpException('Unique constraint violation', HttpStatus.CONFLICT);
    case 'P2002':
      return new HttpException('Foreign key constraint violation', HttpStatus.CONFLICT);
    case 'P2003':
      return new HttpException('Null constraint violation', HttpStatus.BAD_REQUEST);
    case 'P2004':
      return new HttpException('Default constraint violation', HttpStatus.BAD_REQUEST);
    case 'P2005':
      return new HttpException('Check constraint violation', HttpStatus.BAD_REQUEST);
    case 'P2006':
      return new HttpException('Serialization failure', HttpStatus.INTERNAL_SERVER_ERROR);
    case 'P2007':
      return new HttpException('Unique index violation', HttpStatus.CONFLICT);
    default:
      return new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export function exceptionHandler(error): HttpException {
  const errorMessage = error?.response?.message || error?.response?.data?.error_description || error?.response?.data?.errorMessage
  switch (error?.response?.statusCode || error.status) {
    case 400:
      return new BadRequestException(errorMessage);
    case 401:
      return new UnauthorizedException(errorMessage);
    case 403:
      return new ForbiddenException(errorMessage);
    case 404:
      return new NotFoundException(errorMessage);
    case 408:
      return new RequestTimeoutException(errorMessage);
    case 409:
      return new HttpException(errorMessage,409);  
    case 501:
      return new NotImplementedException(errorMessage);
    case 502:
      return new BadGatewayException(errorMessage);
    case 503:
      return new ServiceUnavailableException(errorMessage);
    default:
      return new HttpException('Internal Server Error', 500);
  }
}

export function handleError() {
  return catchError((e) => {
    throw exceptionHandler(e);
  }) as any;
}