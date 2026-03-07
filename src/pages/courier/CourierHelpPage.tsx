import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Phone, FileText } from "lucide-react";

const faqs = [
  { q: "Comment accepter une mission ?", a: "Rendez-vous dans l'onglet Missions, consultez les missions disponibles et cliquez sur \"Accepter\". La mission sera alors assignée à vous." },
  { q: "Comment mettre à jour le statut d'une livraison ?", a: "Dans le détail de la mission, utilisez le bouton de balayage (swipe) pour passer au statut suivant : ramassage, en transit, arrivé, livré." },
  { q: "Comment recevoir mes paiements ?", a: "Vos gains sont crédités automatiquement sur votre portefeuille. Vous pouvez demander un retrait via Orange Money, MTN Money ou en espèces depuis la page Revenus." },
  { q: "Comment changer mes zones de livraison ?", a: "Allez dans votre Profil et sélectionnez les communes où vous souhaitez recevoir des missions." },
  { q: "Que faire si le client est absent ?", a: "Contactez le client par téléphone. Si personne ne répond après 10 minutes, signalez le problème via le détail de la mission." },
];

export default function CourierHelpPage() {
  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Centre d'aide</h1>
          <p className="text-muted-foreground">Trouvez des réponses à vos questions</p>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" /> Questions fréquentes
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 text-center space-y-3">
            <Phone className="w-8 h-8 text-primary mx-auto" />
            <h4 className="font-semibold">Appeler le support</h4>
            <p className="text-sm text-muted-foreground">Disponible 7j/7, 8h-20h</p>
            <Button variant="outline" className="w-full" asChild>
              <a href="tel:+224620000000">+224 620 00 00 00</a>
            </Button>
          </Card>
          <Card className="p-6 text-center space-y-3">
            <MessageCircle className="w-8 h-8 text-primary mx-auto" />
            <h4 className="font-semibold">WhatsApp</h4>
            <p className="text-sm text-muted-foreground">Réponse sous 30 minutes</p>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://wa.me/224620000000" target="_blank" rel="noopener noreferrer">Envoyer un message</a>
            </Button>
          </Card>
        </div>
      </div>
    </CourierLayout>
  );
}
