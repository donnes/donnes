import { GraphQLClient } from 'graphql-request'
import { env } from '../config/env'
import {
  GetAuthorDocument,
  type GetAuthorQuery,
  GetNavbarDocument,
  type GetNavbarQuery,
} from './graphql/types'

export const client = new GraphQLClient(env.HYGRAPH_URL, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.HYGRAPH_PERMANENTAUTH_TOKEN}`,
  },
})

export const Api = {
  getAuthor: async () => {
    const { author } = await client.request<GetAuthorQuery>(GetAuthorDocument)

    return author
  },
  getNavbarLinks: async () => {
    const { navbars } = await client.request<GetNavbarQuery>(GetNavbarDocument)

    return navbars
  },
}
