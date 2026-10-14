import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { generateOpenApiDocument } from './openapi-document';

@Injectable()
class ExternalService {
  constructor() {
    throw new Error('Contract export must not construct external clients');
  }
}

class ContractDto {
  @ApiProperty()
  name: string;
}

@Controller('contract-test')
class ContractController {
  constructor(private readonly external: ExternalService) {
    throw new Error('Contract export must not construct controllers');
  }

  onModuleInit() {
    throw new Error('Contract export must not run lifecycle hooks');
  }

  @Get()
  @ApiOkResponse({ type: ContractDto })
  get(): ContractDto {
    throw new Error('Contract export must not execute handlers');
  }
}

@Module({ controllers: [ContractController], providers: [ExternalService] })
class ContractModule {}

describe('offline OpenAPI export', () => {
  it('keeps route, DTO and security metadata without constructing the application', async () => {
    const document = await generateOpenApiDocument(ContractModule);
    expect(document.paths['/contract-test'].get?.operationId).toBe(
      'ContractController_get',
    );
    expect(document.components?.schemas?.ContractDto).toEqual({
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    });
    expect(document.components?.securitySchemes).toHaveProperty('bearer');
    expect(document.components?.securitySchemes).toHaveProperty('api-key');
    expect(document.components?.securitySchemes).toHaveProperty('oauth2');
  });
});
