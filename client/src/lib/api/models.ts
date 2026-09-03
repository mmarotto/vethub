/**
 * Central type exports for Pet Clinic API
 *
 * Re-exports all OpenAPI types with friendly names for use throughout the application.
 * Import types from here instead of directly from '$lib/types/api'.
 */
import type { components } from '$lib/types/api';

// =============================================================================
// Owner Types
// =============================================================================
export type OwnerResponse = components['schemas']['OwnerResponse'];
export type CreateOwnerRequest = components['schemas']['CreateOwnerRequest'];
export type UpdateOwnerRequest = components['schemas']['UpdateOwnerRequest'];

// =============================================================================
// Pet Types
// =============================================================================
export type PetResponse = components['schemas']['PetResponse'];
export type PetSummaryResponse = components['schemas']['PetSummaryResponse'];
export type CreatePetRequest = components['schemas']['CreatePetRequest'];
export type UpdatePetRequest = components['schemas']['UpdatePetRequest'];

// =============================================================================
// Pet Type Types (the type of pet, e.g., "Cat", "Dog")
// =============================================================================
export type PetTypeResponse = components['schemas']['PetTypeResponse'];
export type CreatePetTypeRequest = components['schemas']['CreatePetTypeRequest'];
export type UpdatePetTypeRequest = components['schemas']['UpdatePetTypeRequest'];

// =============================================================================
// Vet Types
// =============================================================================
export type VetResponse = components['schemas']['VetResponse'];
export type VetSummaryResponse = components['schemas']['VetSummaryResponse'];
export type CreateVetRequest = components['schemas']['CreateVetRequest'];
export type UpdateVetRequest = components['schemas']['UpdateVetRequest'];

// =============================================================================
// Specialty Types
// =============================================================================
export type SpecialtyResponse = components['schemas']['SpecialtyResponse'];
export type CreateSpecialtyRequest = components['schemas']['CreateSpecialtyRequest'];
export type UpdateSpecialtyRequest = components['schemas']['UpdateSpecialtyRequest'];

// =============================================================================
// Visit Types
// =============================================================================
export type VisitResponse = components['schemas']['VisitResponse'];
export type VisitSummaryResponse = components['schemas']['VisitSummaryResponse'];
export type CreateVisitRequest = components['schemas']['CreateVisitRequest'];
export type UpdateVisitRequest = components['schemas']['UpdateVisitRequest'];

// =============================================================================
// Error Types
// =============================================================================
export type ErrorResponse = components['schemas']['ErrorResponseResource'];
export type ValidationErrorResponse = components['schemas']['ValidationErrorResponseResource'];
export type ValidationError = components['schemas']['ValidationErrorResource'];
export type ApiErrorResponse = components['schemas']['ApiErrorResponseResource'];
export type RateLimitErrorResponse = components['schemas']['RateLimitErrorResponseResource'];
