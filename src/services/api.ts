import { GraphQLClient } from 'graphql-request'
import { env } from '../config/env'
import {
  GetMenuDocument,
  type GetMenuQuery,
  GetAuthorDocument,
  type GetAuthorQuery,
  GetPostsDocument,
  type GetPostsQuery,
  type GetPostsQueryVariables,
  GetProjectsDocument,
  type GetProjectsQuery,
  type GetProjectsQueryVariables,
} from './graphql/types'

export const client = new GraphQLClient(env.HYGRAPH_URL, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.HYGRAPH_PERMANENTAUTH_TOKEN}`,
  },
})

export const Api = {
  getMenu: async () => {
    const { menus } = await client.request<GetMenuQuery>(GetMenuDocument)

    return menus
  },
  getAuthor: async () => {
    const { author } = await client.request<GetAuthorQuery>(GetAuthorDocument)

    return author
  },
  getPosts: async (variables: GetPostsQueryVariables) => {
    const { posts } = await client.request<
      GetPostsQuery,
      GetPostsQueryVariables
    >(GetPostsDocument, variables)

    return posts
  },
  getProjects: async (variables: GetProjectsQueryVariables) => {
    const { projects } = await client.request<
      GetProjectsQuery,
      GetProjectsQueryVariables
    >(GetProjectsDocument, variables)

    return projects
  },
}
