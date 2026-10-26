import { FacebookIcon, InstagramIcon } from "@/components/ui/icons";
import { SOCIAL_LINKS } from "@/content/site";

const ICONS = { instagram: InstagramIcon, facebook: FacebookIcon };

export function SocialLinks() {
  return (
    <ul className="flex items-center gap-2">
      {SOCIAL_LINKS.map(({ id, label, href }) => {
        const Icon = ICONS[id];
        // A "#" placeholder would just reopen this page, so only real profiles get a new tab.
        const external = href !== "#";
        return (
          <li key={id}>
            <a
              href={href}
              aria-label={external ? `${label} (opens in a new tab)` : label}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            >
              <Icon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
