import { GraphQLClient } from 'graphql-request'
import format from 'date-fns/format'
import { env } from '../config/env'
import {
  GetFeatureFlagsDocument,
  type GetFeatureFlagsQuery,
  GetMenuDocument,
  type GetMenuQuery,
  GetAuthorDocument,
  type GetAuthorQuery,
  GetPostsDocument,
  type GetPostsQuery,
  type GetPostsQueryVariables,
  GetPostsSlugDocument,
  type GetPostsSlugQuery,
  GetPostDocument,
  type GetPostQuery,
  type GetPostQueryVariables,
  GetProjectsDocument,
  type GetProjectsQuery,
  type GetProjectsQueryVariables,
  GetJobsDocument,
  type GetJobsQuery,
  type GetJobsQueryVariables,
} from './graphql/types'

export const client = new GraphQLClient(env.HYGRAPH_URL, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.HYGRAPH_PERMANENTAUTH_TOKEN}`,
  },
})

export const Api = {
  getFeatureFlags: async () => {
    const { featureFlags } = await client.request<GetFeatureFlagsQuery>(
      GetFeatureFlagsDocument,
    )

    return featureFlags
  },
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

    return posts.map((post) => ({
      ...post,
      createdAt: format(new Date(post.createdAt), 'MMMM dd yyyy'),
    }))
  },
  getPostsSlug: async () => {
    const { posts } = await client.request<GetPostsSlugQuery>(
      GetPostsSlugDocument,
    )

    return posts.map((post) => post.slug)
  },
  getPost: async (variables: GetPostQueryVariables) => {
    const { post } = await client.request<GetPostQuery, GetPostQueryVariables>(
      GetPostDocument,
      variables,
    )

    return {
      ...post,
      formattedCreatedAt: format(new Date(post?.createdAt), 'MMMM dd yyyy'),
    }
  },
  getProjects: async (variables: GetProjectsQueryVariables) => {
    const { projects } = await client.request<
      GetProjectsQuery,
      GetProjectsQueryVariables
    >(GetProjectsDocument, variables)

    return projects
  },
  getJobs: async (variables?: GetJobsQueryVariables) => {
    const { jobs } = await client.request<GetJobsQuery, GetJobsQueryVariables>(
      GetJobsDocument,
      variables,
    )

    return jobs.map((job) => ({
      ...job,
      startDate: format(new Date(`${job.startDate} 23:00:00`), 'MMM yyyy'),
      endDate: !job?.endDate
        ? 'Present'
        : format(new Date(`${job.endDate} 23:00:00`).setHours(23), 'MMM yyyy'),
    }))
  },
}
