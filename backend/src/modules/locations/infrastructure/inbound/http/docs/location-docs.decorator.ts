import { applyDecorators, Delete, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OPENAPI_ACCESS_TOKEN_SCHEME } from 'src/common/openapi/openapi-access-token-scheme.constant';
import { standardError } from 'src/common/openapi/standard-error-doc.helper';
import {
  CreateCityBodyDto,
  CreateCountryBodyDto,
  CreateStateBodyDto,
  UpdateCityBodyDto,
  UpdateCountryBodyDto,
  UpdateStateBodyDto,
} from 'src/modules/locations/application/dto';
import {
  CityPublicOpenApiDto,
  CountryPublicOpenApiDto,
  StatePublicOpenApiDto,
} from '../schemas/location-public-http.openapi.dto';

export function ApiLocationsCountries() {
  return applyDecorators(
    ApiTags('Locations — Countries'),
    ApiBearerAuth(OPENAPI_ACCESS_TOKEN_SCHEME),
  );
}

export function ApiLocationsStates() {
  return applyDecorators(ApiTags('Locations — States'), ApiBearerAuth(OPENAPI_ACCESS_TOKEN_SCHEME));
}

export function ApiLocationsCities() {
  return applyDecorators(ApiTags('Locations — Cities'), ApiBearerAuth(OPENAPI_ACCESS_TOKEN_SCHEME));
}

export class CountryDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List countries' }),
      ApiResponse({
        status: 200,
        description:
          'List. Actual response wraps payload in `{ success, timestamp, data }` as array of countries.',
        type: [CountryPublicOpenApiDto],
      }),
      standardError(401, 'Unauthorized'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({ summary: 'Create country' }),
      ApiBody({ type: CreateCountryBodyDto }),
      ApiResponse({
        status: 201,
        description: 'Created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CountryPublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(409, 'Conflict'),
      standardError(429, 'Rate limit'),
    );
  }

  static FindById() {
    return applyDecorators(
      Get(':id'),
      ApiOperation({ summary: 'Get country by id' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 200,
        description: 'Country. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CountryPublicOpenApiDto,
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Update() {
    return applyDecorators(
      Patch(':id'),
      ApiOperation({ summary: 'Update country' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiBody({ type: UpdateCountryBodyDto }),
      ApiResponse({
        status: 200,
        description: 'Updated. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CountryPublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Delete() {
    return applyDecorators(
      Delete(':id'),
      ApiOperation({ summary: 'Delete country' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 204,
        description: 'No content (envelope may still apply per gateway)',
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(409, 'Referenced by states'),
      standardError(429, 'Rate limit'),
    );
  }
}

export class StateDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List states by country' }),
      ApiQuery({ name: 'countryUuid', required: true, format: 'uuid' }),
      ApiResponse({
        status: 200,
        description:
          'List. Actual response wraps payload in `{ success, timestamp, data }` as array of states.',
        type: [StatePublicOpenApiDto],
      }),
      standardError(400, 'Invalid query'),
      standardError(401, 'Unauthorized'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({ summary: 'Create state' }),
      ApiBody({ type: CreateStateBodyDto }),
      ApiResponse({
        status: 201,
        description: 'Created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: StatePublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(409, 'Conflict'),
      standardError(429, 'Rate limit'),
    );
  }

  static FindById() {
    return applyDecorators(
      Get(':id'),
      ApiOperation({ summary: 'Get state by id' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 200,
        description: 'State. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: StatePublicOpenApiDto,
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Update() {
    return applyDecorators(
      Patch(':id'),
      ApiOperation({ summary: 'Update state' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiBody({ type: UpdateStateBodyDto }),
      ApiResponse({
        status: 200,
        description: 'Updated. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: StatePublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Delete() {
    return applyDecorators(
      Delete(':id'),
      ApiOperation({ summary: 'Delete state' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({ status: 204, description: 'No content' }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(409, 'Referenced'),
      standardError(429, 'Rate limit'),
    );
  }
}

export class CityDoc {
  static List() {
    return applyDecorators(
      Get(),
      ApiOperation({ summary: 'List cities by state' }),
      ApiQuery({ name: 'stateUuid', required: true, format: 'uuid' }),
      ApiResponse({
        status: 200,
        description:
          'List. Actual response wraps payload in `{ success, timestamp, data }` as array of cities.',
        type: [CityPublicOpenApiDto],
      }),
      standardError(400, 'Invalid query'),
      standardError(401, 'Unauthorized'),
      standardError(429, 'Rate limit'),
    );
  }

  static Create() {
    return applyDecorators(
      Post(),
      ApiOperation({ summary: 'Create city' }),
      ApiBody({ type: CreateCityBodyDto }),
      ApiResponse({
        status: 201,
        description: 'Created. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CityPublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(409, 'Conflict'),
      standardError(429, 'Rate limit'),
    );
  }

  static FindById() {
    return applyDecorators(
      Get(':id'),
      ApiOperation({ summary: 'Get city by id' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({
        status: 200,
        description: 'City. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CityPublicOpenApiDto,
      }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Update() {
    return applyDecorators(
      Patch(':id'),
      ApiOperation({ summary: 'Update city' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiBody({ type: UpdateCityBodyDto }),
      ApiResponse({
        status: 200,
        description: 'Updated. Actual response wraps payload in `{ success, timestamp, data }`.',
        type: CityPublicOpenApiDto,
      }),
      standardError(400, 'Invalid body'),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(429, 'Rate limit'),
    );
  }

  static Delete() {
    return applyDecorators(
      Delete(':id'),
      ApiOperation({ summary: 'Delete city' }),
      ApiParam({ name: 'id', format: 'uuid' }),
      ApiResponse({ status: 204, description: 'No content' }),
      standardError(401, 'Unauthorized'),
      standardError(404, 'Not found'),
      standardError(409, 'Referenced'),
      standardError(429, 'Rate limit'),
    );
  }
}
