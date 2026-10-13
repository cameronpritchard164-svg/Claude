import { createFileRoute } from '@tanstack/react-router'
import { handleRequest } from '#/theme/site'

export const Route = createFileRoute('/$')({
  server: { handlers: { GET: ({ request }) => handleRequest(request) } },
})
