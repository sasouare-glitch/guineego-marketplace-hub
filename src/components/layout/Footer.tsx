/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
const BUILD_DATE: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev';

import { Link } from "react-router-dom";
import { 
  Package, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/guineego", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/guineego", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/guineego", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com/guineego", label: "Youtube" },
];

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    marketplace: [
      { name: t.footer.allProducts, href: "/marketplace" },
      { name: t.footer.promotions, href: "/marketplace/promos" },
      { name: t.footer.categories, href: "/categories" },
      { name: t.footer.bestSellers, href: "/marketplace/bestsellers" },
    ],
    vendeurs: [
      { name: t.footer.becomeSeller, href: "/sell/start" },
      { name: t.footer.sellerCenter, href: "/seller/dashboard" },
      { name: t.footer.sellerGuide, href: "/seller/guide" },
      { name: t.footer.pricing, href: "/seller/pricing" },
    ],
    services: [
      { name: t.footer.transitChina, href: "/transit" },
      { name: t.footer.academy, href: "/academy" },
      { name: t.footer.expressDelivery, href: "/delivery" },
      { name: t.footer.invest, href: "/invest" },
    ],
    aide: [
      { name: t.footer.helpCenter, href: "/help" },
      { name: "📦 Suivre ma commande", href: "/track" },
      { name: t.footer.myOrders, href: "/orders" },
      { name: t.footer.returns, href: "/returns" },
      { name: t.footer.contactUs, href: "/contact" },
    ],
  };

  return (
    <footer className="bg-dark-gradient text-white">
      {/* Main Footer */}
      <div className="container-tight section-padding">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                GuineeGo<span className="text-guinea-yellow"> LAT</span>
              </span>
            </Link>
            <p className="text-white/70 mb-6 max-w-xs">
              {t.footer.description}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="tel:+224623456789" className="flex items-center gap-3 text-white/70 hover:text-guinea-yellow transition-colors">
                <Phone className="w-4 h-4" />
                <span>+224 623 456 789</span>
              </a>
              <a href="mailto:contact@guineego.com" className="flex items-center gap-3 text-white/70 hover:text-guinea-yellow transition-colors">
                <Mail className="w-4 h-4" />
                <span>contact@guineego.com</span>
              </a>
              <div className="flex items-start gap-3 text-white/70">
                <MapPin className="w-4 h-4 mt-1" />
                <span>Kaloum, Conakry, Guinée</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white/70 hover:bg-guinea-yellow hover:text-foreground transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display font-semibold mb-4">{t.footer.marketplaceTitle}</h4>
            <ul className="space-y-3">
              {footerLinks.marketplace.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-white/70 hover:text-guinea-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t.footer.sellersTitle}</h4>
            <ul className="space-y-3">
              {footerLinks.vendeurs.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-white/70 hover:text-guinea-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t.footer.servicesTitle}</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-white/70 hover:text-guinea-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t.footer.helpTitle}</h4>
            <ul className="space-y-3">
              {footerLinks.aide.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-white/70 hover:text-guinea-yellow transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-tight py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © 2024 GuineeGo LAT. {t.footer.copyright}. 
            <span className="ml-2 text-white/30 font-mono text-xs">v1.0.0-{BUILD_DATE}</span>
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-white/50 hover:text-guinea-yellow transition-colors">
              {t.footer.privacy}
            </Link>
            <Link to="/terms" className="text-white/50 hover:text-guinea-yellow transition-colors">
              {t.footer.terms}
            </Link>
            <Link to="/legal" className="text-white/50 hover:text-guinea-yellow transition-colors">
              {t.footer.legalNotice}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
