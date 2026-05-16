import { describe, expect, it } from 'vitest'
import { getOpenAPISpec } from '@/lib/openapi'

describe('OpenAPI documentation', () => {
  it('documents auth, admin, assignment, and protected endpoints', () => {
    const spec = getOpenAPISpec() as any

    expect(spec.paths['/auth/login']).toBeTruthy()
    expect(spec.paths['/auth/logout']).toBeTruthy()
    expect(spec.paths['/auth/forgot-password']).toBeTruthy()
    expect(spec.paths['/auth/reset-password']).toBeTruthy()
    expect(spec.paths['/admin/users']).toBeTruthy()
    expect(spec.paths['/admin/teams']).toBeTruthy()
    expect(spec.paths['/admin/clients']).toBeTruthy()
    expect(spec.paths['/tags']).toBeTruthy()
    expect(spec.paths['/tags/{id}']).toBeTruthy()
    expect(spec.paths['/tags/{id}/deactivate']).toBeTruthy()
    expect(spec.paths['/admin/projects/{id}/assignments']).toBeTruthy()
    expect(spec.paths['/admin/clients/{id}/assignments']).toBeTruthy()
    expect(spec.paths['/stats'].get.responses['403']).toBeTruthy()
    expect(spec.paths['/insights'].post.responses['403']).toBeTruthy()
  })

  it('documents shared schemas and cookie auth', () => {
    const spec = getOpenAPISpec() as any

    expect(spec.components.securitySchemes.cookieAuth).toBeTruthy()
    expect(spec.components.schemas.User.properties.role.enum).toEqual(['ADMIN', 'MANAGER', 'EMPLOYEE'])
    expect(spec.components.schemas.Team).toBeTruthy()
    expect(spec.components.schemas.Client).toBeTruthy()
    expect(spec.components.schemas.ProjectAssignment).toBeTruthy()
    expect(spec.components.schemas.ClientAssignment).toBeTruthy()
    expect(spec.components.schemas.SecurityEvent).toBeTruthy()
    expect(spec.components.schemas.Tag.properties.status.enum).toEqual(['ACTIVE', 'INACTIVE'])
    expect(spec.paths['/tags'].get.parameters.map((p: any) => p.name)).toEqual(['status', 'q', 'includeUsage'])
    expect(spec.paths['/tags'].post.responses['409']).toBeTruthy()
    expect(spec.paths['/tags/{id}'].delete.responses['409']).toBeTruthy()
  })
})
