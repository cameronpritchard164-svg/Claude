// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router'
import { handleRequest } from '#/app/server'

export const Route = createFileRoute('/$')({
  server: { handlers: { GET: ({ request }: { request: Request }) => handleRequest(request), POST: ({ request }: { request: Request }) => handleRequest(request) } },
})
