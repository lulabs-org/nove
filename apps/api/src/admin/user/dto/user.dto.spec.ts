import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateAdminUserDto,
  QueryUsersDto,
  UpdateAdminUserDto,
} from './user.dto';

describe('Admin user DTOs', () => {
  describe('QueryUsersDto', () => {
    it('treats empty query parameters as omitted values', async () => {
      const dto = plainToInstance(QueryUsersDto, {
        page: '',
        pageSize: '  ',
        keyword: '',
        active: '',
        sortBy: '',
        sortOrder: '',
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto).toMatchObject({
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(dto.keyword).toBeUndefined();
      expect(dto.active).toBeUndefined();
    });

    it('still rejects invalid non-empty query parameters', async () => {
      const dto = plainToInstance(QueryUsersDto, {
        page: 'zero',
        active: 'yes',
        sortBy: 'name',
        sortOrder: 'up',
      });

      const errors = await validate(dto);

      expect(errors.map(({ property }) => property).sort()).toEqual([
        'active',
        'page',
        'sortBy',
        'sortOrder',
      ]);
    });
  });

  describe.each([CreateAdminUserDto, UpdateAdminUserDto])('%p', (Dto) => {
    it('accepts empty nullable profile and identifier fields', async () => {
      const dto = plainToInstance(Dto, {
        username: ' ',
        email: '',
        countryCode: '',
        phone: '',
        displayName: '',
        avatar: '',
        bio: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        city: '',
        country: '',
        zipCode: '',
        website: '',
        active: '',
      });

      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.username).toBeNull();
      expect(dto.email).toBeNull();
      expect(dto.avatar).toBeNull();
      expect(dto.fullName).toBeNull();
      expect(dto.dateOfBirth).toBeNull();
      expect(dto.gender).toBeNull();
      expect(dto.website).toBeNull();
      expect(dto.active).toBeUndefined();
    });
  });

  describe('tags', () => {
    it('treats a blank tag query as omitted', async () => {
      const dto = plainToInstance(QueryUsersDto, { tag: '  ' });

      await expect(validate(dto)).resolves.toHaveLength(0);
      expect(dto.tag).toBeUndefined();
    });

    it('accepts a string array and null', async () => {
      await expect(
        validate(plainToInstance(CreateAdminUserDto, { tags: ['大客户'] })),
      ).resolves.toHaveLength(0);
      await expect(
        validate(plainToInstance(UpdateAdminUserDto, { tags: null })),
      ).resolves.toHaveLength(0);
    });

    it('rejects non-string items, overlong tags and more than 50 tags', async () => {
      const cases = [
        { tags: [1] },
        { tags: ['x'.repeat(51)] },
        { tags: Array.from({ length: 51 }, (_, index) => `t${index}`) },
        { tags: '大客户' },
      ];
      for (const payload of cases) {
        const errors = await validate(
          plainToInstance(CreateAdminUserDto, payload),
        );
        expect(errors.map((error) => error.property)).toContain('tags');
      }
    });
  });
});
