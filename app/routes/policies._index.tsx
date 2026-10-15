import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/policies._index';
import type {PoliciesQuery, PolicyItemFragment} from 'storefrontapi.generated';
import {PageHero} from '~/components/PageHero';
import {ArrowIcon} from '~/components/icons';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = () =>
  seoMeta({
    title: 'Policies',
    description:
      'Shipping, refund, privacy and terms of service for the Desert Sands Mechanical online shop.',
    path: '/policies',
  });

export async function loader({context}: Route.LoaderArgs) {
  const data: PoliciesQuery = await context.storefront.query(POLICIES_QUERY);

  const shopPolicies = data.shop;
  const policies: PolicyItemFragment[] = [
    shopPolicies?.shippingPolicy,
    shopPolicies?.refundPolicy,
    shopPolicies?.termsOfService,
    shopPolicies?.privacyPolicy,
    shopPolicies?.subscriptionPolicy,
  ].filter((policy): policy is PolicyItemFragment => policy != null);

  if (!policies.length) {
    throw new Response('No policies found', {status: 404});
  }

  return {policies};
}

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Policies"
        intro="The fine print for buying from us online."
        crumb="Policies"
      />
      <section className="container-x py-12 md:py-16">
        <ul className="grid gap-4 sm:grid-cols-2">
          {policies.map((policy) => (
            <li key={policy.id}>
              <Link
                to={`/policies/${policy.handle}`}
                prefetch="intent"
                className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-sand/60"
              >
                <span className="font-display text-lg uppercase tracking-wide">
                  {policy.title}
                </span>
                <ArrowIcon className="h-5 w-5 text-sand transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyItem on ShopPolicy {
    id
    title
    handle
  }
  query Policies ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...PolicyItem
      }
      shippingPolicy {
        ...PolicyItem
      }
      termsOfService {
        ...PolicyItem
      }
      refundPolicy {
        ...PolicyItem
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
` as const;
