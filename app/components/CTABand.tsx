import {contactUrl, site} from '~/lib/site';
import {PhoneIcon, ArrowIcon} from './icons';

/** Phone / contact call-to-action strip, matching the main site's CTABand. */
export function CTABand({
  heading = 'Not sure what fits your rig?',
  sub = "Call the workshop before you buy. We fit what we sell, and we'll tell you straight if a part isn't right for your setup.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface">
      <div className="tread absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl">{heading}</h2>
          <p className="mt-3 text-muted">{sub}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`tel:${site.phoneIntl}`} className="btn btn-primary">
            <PhoneIcon className="h-4 w-4" />
            {site.phone}
          </a>
          <a href={contactUrl} className="btn btn-outline">
            Contact us
            <ArrowIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
