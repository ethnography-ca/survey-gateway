import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async (req, context) => {
  // SPOP is an "atomic" operation. It pulls one link out and deletes it instantly.
  const uniqueLink = await redis.spop("survey_links");

  if (!uniqueLink) {
    return new Response("Sorry! All survey links have been used.", { status: 404 });
  }

  // This sends the user to their unique link immediately
  return Response.redirect(uniqueLink, 302);
};
