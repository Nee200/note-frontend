const fs = require('fs');

let content = fs.readFileSync('tmp_products.js', 'utf8');

const fragranceNotes = [
    {
        keywords: [/aventus/i],
        notes: { head: "Ananas, Bergamotte, Apfel", heart: "Birke, Patschuli, marokkanischer Jasmin, Rose", base: "Moschus, Eichenmoos, Ambra, Vanille" }
    },
    {
        keywords: [/baccarat rouge/i],
        notes: { head: "Jasmin, Safran", heart: "Amberwood, Ambergris", base: "Tannenharz, Zedernholz" }
    },
    {
        keywords: [/sauvage/i],
        notes: { head: "Pfeffer, kalabrische Bergamotte", heart: "Geranie, Lavendel, Szechuanpfeffer, Elemi, Rosa Pfeffer, Vetiver, Patschuli", base: "Zeder, Labdanum, Ambroxan" }
    },
    {
        keywords: [/alien/i],
        notes: { head: "Jasmin", heart: "Holzige Noten", base: "Amber" }
    },
    {
        keywords: [/black opium/i],
        notes: { head: "Rosa Pfeffer, Orangenblüte, Birne", heart: "Kaffee, Jasmin, Bittermandel, Lakritze", base: "Vanille, Patschuli, Zeder, Kaschmirholz" }
    },
    {
        keywords: [/la vie est belle/i],
        notes: { head: "schwarze Johannisbeere, Birne", heart: "Iris, Jasmin, Orangenblüte", base: "Praline, Vanille, Patschuli, Tonkabohne" }
    },
    {
        keywords: [/good girl/i, /carolina herrera/i],
        notes: { head: "Mandel, Kaffee, Bergamotte, Zitrone", heart: "Tuberose, Jasmin, Orangenblüte, Iris, bulgarische Rose", base: "Tonkabohne, Kakao, Vanille, Praline, Sandelholz, Moschus, Amber, Kaschmirholz, Zimt, Patschuli, Zeder" }
    },
    {
        keywords: [/creed.*silver mountain water/i, /silver mountain water/i],
        notes: { head: "Bergamotte, Mandarine", heart: "Grüner Tee, schwarze Johannisbeere", base: "Galbanum, Moschus, Sandelholz, Pomeranze" }
    },
    {
        keywords: [/creed.*irish tweed/i, /green irish tweed/i],
        notes: { head: "Iris, Zitronenverbene", heart: "Veilchenblatt", base: "Sandelholz, Ambra" }
    },
    {
        keywords: [/creed.*absolu/i, /aventus absolu/i],
        notes: { head: "Pampelmuse, Bergamotte, schwarze Johannisbeere", heart: "Ingwer, Zimt, Kardamom, Zitrone", base: "Rosa Pfeffer, Vetiver, Patschuli" }
    },
    {
        keywords: [/tobacco vanille/i],
        notes: { head: "Tabakblatt, würzige Noten", heart: "Tonkabohne, Tabakblüte, Vanille, Kakao", base: "Getrocknete Früchte, holzige Noten" }
    },
    {
        keywords: [/oud wood/i],
        notes: { head: "Rosenholz, Kardamom, chinesischer Pfeffer", heart: "Oud, Sandelholz, Vetiver", base: "Tonkabohne, Vanille, Amber" }
    },
    {
        keywords: [/lost cherry/i],
        notes: { head: "Schwarze Kirsche, Kirschlikör, Bittermandel", heart: "Sauerkirsche, türkische Rose, arabischer Jasmin", base: "Perubalsam, geröstete Tonkabohne, Sandelholz, Vetiver, Zeder" }
    },
    {
        keywords: [/bitter peach/i],
        notes: { head: "Pfirsich, Blutorange, Kardamom, Heliotrop", heart: "Rum, Cognac, Davana, Jasmin", base: "indonesisches Patschuliblatt, Vanille, Sandelholz, Tonkabohne, Cashmeran, Benzoeharz, Styrax, Labdanum, Vetiver" }
    },
    {
        keywords: [/fucking fabulous/i, /fabulos/i],
        notes: { head: "Muskatellersalbei, Lavendel", heart: "Bittermandel, Vanille, Leder, Iris", base: "Tonkabohne, Leder, Cashmeran, Amber, helle Hölzer" }
    },
    {
        keywords: [/tuscan leather/i],
        notes: { head: "Safran, Himbeere, Thymian", heart: "Olibanum, Jasmin", base: "Leder, Wildleder, Amber, holzige Noten" }
    },
    {
        keywords: [/ombre leather/i],
        notes: { head: "Kardamom", heart: "Leder, arabischer Jasmin", base: "Amber, Moos, Patschuli" }
    },
    {
        keywords: [/neroli portofino/i],
        notes: { head: "Bergamotte, Mandarine, Zitrone, Lavendel, Myrte, Rosmarin, Bitterorange", heart: "Afrikanische Orangenblüte, Jasmin, Neroli, Klebsame", base: "Amber, Ambrette, Engelwurz" }
    },
    {
        keywords: [/black orchid/i],
        notes: { head: "Trüffel, Gardenie, schwarze Johannisbeere, Ylang-Ylang, Jasmin, Bergamotte, Mandarine, Zitrone", heart: "Orchidee, Gewürze, Gardenie, fruchtige Noten, Ylang-Ylang, Jasmin, Lotus", base: "mexikanische Schokolade, Patschuli, Vanille, Weihrauch, Amber, Sandelholz, Vetiver, weißer Moschus" }
    },
    {
        keywords: [/1 million/i, /one million/i],
        notes: { head: "Blutorange, Grapefruit, Minze", heart: "Zimt, würzige Noten, Rose", base: "Amber, Leder, holzige Noten, indisches Patschuli" }
    },
    {
        keywords: [/invictus/i],
        notes: { head: "Maritime Noten, Grapefruit, Mandarine", heart: "Lorbeerblatt, Jasmin", base: "Ambra, Guajakholz, Eichenmoos, Patschuli" }
    },
    {
        keywords: [/olympea/i],
        notes: { head: "Grüne Mandarine, Wasserjasmin, Ingwerblüte", heart: "Vanille, Salz", base: "Ambergris, Kaschmirholz, Sandelholz" }
    },
    {
        keywords: [/lady million/i],
        notes: { head: "Himbeere, Neroli, Amalfizitronen", heart: "Jasmin, afrikanische Orangenblüte, Gardenie", base: "weißer Honig, Patschuli, Amber" }
    },
    {
        keywords: [/bleu.*chanel/i, /chanel bleu/i],
        notes: { head: "Grapefruit, Zitrone, Minze, rosa Pfeffer", heart: "Ingwer, Muskatnuss, Jasmin, Iso E Super", base: "Weihrauch, Vetiver, Zeder, Sandelholz, Patschuli, Labdanum, weißer Moschus" }
    },
    {
        keywords: [/allure.*sport/i],
        notes: { head: "Orange, maritime Noten, Aldehyde, Blutorange", heart: "Pfeffer, Neroli, Zeder", base: "Tonkabohne, Vanille, weißer Moschus, Ambra, Vetiver, Elemiharz" }
    },
    {
        keywords: [/chance.*tendre/i],
        notes: { head: "Quitte, Grapefruit", heart: "Hyazinthe, Jasmin", base: "Moschus, Iris, Zeder, Amber" }
    },
    {
        keywords: [/coco mademoiselle/i],
        notes: { head: "Orange, Mandarine, Bergamotte, Orangenblüte", heart: "türkische Rose, Jasmin, Mimose, Ylang-Ylang", base: "Patschuli, weißer Moschus, Vanille, Vetiver, Tonkabohne, Opoponax" }
    },
    {
        keywords: [/chance/i],
        notes: { head: "Rosa Pfeffer", heart: "Jasmin, Iris", base: "Patschuli, Moschus, Vanille" }
    },
    {
        keywords: [/n5/i, /no 5/i, /chanel no/i],
        notes: { head: "Aldehyde, Ylang-Ylang, Neroli, Bergamotte, Pfirsich", heart: "Iris, Jasmin, Rose, Maiglöckchen", base: "Sandelholz, Vanille, Eichenmoos, Vetiver, Patschuli" }
    },
    {
        keywords: [/dior homme/i],
        notes: { head: "Lavendel, Bergamotte, Salbei", heart: "Iris, Kakao, Amber", base: "Leder, Vetiver, Patschuli" }
    },
    {
        keywords: [/dior.*homme.*intense/i],
        notes: { head: "Lavendel", heart: "Iris, Ambrette, Birne", base: "Zeder, Vetiver" }
    },
    {
        keywords: [/fahrenheit/i],
        notes: { head: "Muskatblüte, Lavendel, Zeder, Kamille, Mandarine, Hagedorn, Bergamotte, Zitrone", heart: "Veilchenblatt, Muskatnuss, Zeder, Sandelholz, Gartennelke, Geißblatt, Jasmin, Maiglöckchen", base: "Leder, Vetiver, Moschus, Amber, Patschuli, Tonkabohne" }
    },
    {
        keywords: [/jadore/i, /j'adore/i],
        notes: { head: "Birne, Melone, Magnolie, Pfirsich, Mandarine, Bergamotte", heart: "Jasmin, Maiglöckchen, Tuberose, Freesie, Rose, Orchidee, Pflaume, Veilchen", base: "Moschus, Vanille, Brombeere, Zeder" }
    },
    {
        keywords: [/miss dior/i],
        notes: { head: "Rosa Pfeffer, Blutorange, süße Orange, Mandarine, kalabrische Bergamotte, Zitrone", heart: "Grasse-Rose, Damaszenerrose, Jasminblatt", base: "Patschuli, Palisanderholz" }
    },
    {
        keywords: [/poison/i],
        notes: { head: "Pflaume, Waldbeeren, Koriander, Anis, brasilianisches Rosenholz", heart: "Tuberose, Weihrauch, weißer Honig, Zimt, Opoponax, Gartennelke, Jasmin, afrikanische Orangenblüte, Rose", base: "Vanille, Amber, Sandelholz, Moschus, Heliotrop, Vetiver, Zeder" }
    },
    {
        keywords: [/hypnotic poison/i],
        notes: { head: "Kokosnuss, Pflaume, Aprikose", heart: "brasilianisches Rosenholz, Jasmin, Kümmel, Tuberose, Rose, Maiglöckchen", base: "Vanille, Mandel, Sandelholz, Moschus" }
    },
    {
        keywords: [/acqua.*gio/i],
        notes: { head: "Limette, Zitrone, Bergamotte, Jasmin, Orange, Mandarine, Neroli", heart: "maritime Noten, Jasmin, Calone, Pfirsich, Freesie, Alpenveilchen, Hyazinthe, Rosmarin, Veilchen, Koriander, Muskatnuss, Rose, Reseda", base: "weißer Moschus, Zeder, Eichenmoos, Patschuli, Amber" }
    },
    {
        keywords: [/armani code/i],
        notes: { head: "Zitrone, Bergamotte", heart: "Sternanis, Olivenblüte, Guajakholz", base: "Leder, Tonkabohne, Tabak" }
    },
    {
        keywords: [/my way/i],
        notes: { head: "Orangenblüte, Bergamotte", heart: "Tuberose, indischer Jasmin", base: "Madagaskar-Vanille, weißer Moschus, Zeder" }
    },
    {
        keywords: [/si/i],
        notes: { head: "Johannisbeernektar", heart: "Mairose, Freesie", base: "Vanille, Patschuli, holzige Noten, Ambroxan" }
    },
    {
        keywords: [/stronger with you/i],
        notes: { head: "Kardamom, rosa Pfeffer, Veilchenblatt, Minze", heart: "Ananas, Zimt, Melone, Salbei, Lavendel", base: "Vanille, Kastanie, Amberwood, Zeder, Guajakholz" }
    },
    {
        keywords: [/le male/i],
        notes: { head: "Lavendel, Minze, Kardamom, Bergamotte, Artemisia", heart: "Zimt, Orangenblüte, Kümmel", base: "Vanille, Tonkabohne, Amber, Sandelholz, Zeder" }
    },
    {
        keywords: [/ultra male/i],
        notes: { head: "Birne, Lavendel, Minze, Bergamotte, Zitrone", heart: "Zimt, Muskatellersalbei, Kümmel", base: "schwarze Vanilleschote, Amber, Patschuli, Zeder" }
    },
    {
        keywords: [/scandal/i],
        notes: { head: "Blutorange, Mandarine", heart: "Honig, Gardenie, Orangenblüte, Jasmin, Pfirsich", base: "Bienenwachs, Karamell, Patschuli, Lakritze" }
    },
    {
        keywords: [/classique/i],
        notes: { head: "Orangenblüte, Sternanis, Rose, Mandarine, Birne, Bergamotte", heart: "Ylang-Ylang, Ingwer, Orchidee, Iris, Tuberose, Pflaume", base: "Vanille, Amber, Moschus, Zimt, Sandelholz" }
    },
    {
        keywords: [/la nuit de l'homme/i, /nuit.*homme/i],
        notes: { head: "Kardamom", heart: "Lavendel, Virginiazeder, Bergamotte", base: "Vetiver, Kümmel" }
    },
    {
        keywords: [/y edp/i, /ysl y/i, /^y$/i],
        notes: { head: "Apfel, Ingwer, Bergamotte", heart: "Salbei, Wacholderbeere, Geranie", base: "Amberwood, Tonkabohne, Zeder, Vetiver, Olibanum" }
    },
    {
        keywords: [/libre/i],
        notes: { head: "Lavendel, Mandarine, schwarze Johannisbeere, Petitgrain", heart: "Lavendel, Orangenblüte, Jasmin", base: "Madagaskar-Vanille, Moschus, Zeder, Ambergris" }
    },
    {
        keywords: [/opium/i],
        notes: { head: "Koriander, Pflaume, Zitrusfrüchte, Mandarine, Pfeffer, Jasmin, Nelke, indischer Lorbeer, Bergamotte", heart: "Gartennelke, Sandelholz, Patschuli, Zimt, Iriswurzel, Pfirsich, Maiglöckchen, Rose", base: "Labdanum, Tolubalsam, Sandelholz, Opoponax, Moschus, Kokosnuss, Vanille, Benzoeharz, Vetiver, Weihrauch, Zeder, Myrrhe, Castoreum, Amber" }
    },
    {
        keywords: [/boss bottled/i],
        notes: { head: "Apfel, Pflaume, Bergamotte, Zitrone, Eichenmoos, Geranie", heart: "Zimt, Mahagoni, Gartennelke", base: "Vanille, Sandelholz, Zeder, Vetiver, Olivenbaum" }
    },
    {
        keywords: [/the scent/i],
        notes: { head: "Ingwer, Bergamotte, Mandarine", heart: "Maninka, Lavendel", base: "Leder, holzige Noten" }
    },
    {
        keywords: [/boss orange/i],
        notes: { head: "Roter Apfel, Koriander", heart: "Weihrauch, Szechuanpfeffer", base: "Vanille, holzige Noten" }
    },
    {
        keywords: [/layton/i],
        notes: { head: "Apfel, Lavendel, Bergamotte, Mandarine", heart: "Geranie, Veilchen, Jasmin", base: "Vanille, Kardamom, Sandelholz, Pfeffer, Patschuli, Guajakholz" }
    },
    {
        keywords: [/pegasus/i],
        notes: { head: "Heliotrop, Kümmel, Bergamotte", heart: "Bittermandel, Lavendel, Jasmin", base: "Vanille, Sandelholz, Amber" }
    },
    {
        keywords: [/herod/i],
        notes: { head: "Zimt, Pfefferholz", heart: "Tabakblatt, Weihrauch, Osmanthus, Labdanum", base: "Vanille, Iso E Super, Zeder, Moschus, Cypriol" }
    },
    {
        keywords: [/delina/i],
        notes: { head: "Litschi, Rhabarber, Bergamotte, Muskat", heart: "türkische Rose, Pfingstrose, Moschus, Petalia, Vanille", base: "Cashmeran, Zeder, haitianisches Vetiver, Weihrauch" }
    },
    {
        keywords: [/baccarat/i],
        notes: { head: "Jasmin, Safran", heart: "Amberwood, Ambergris", base: "Tannenharz, Zedernholz" }
    },
    {
        keywords: [/oud for greatness/i],
        notes: { head: "Safran, Muskat, Lavendel", heart: "Agarholz (Oud)", base: "Patschuli, Moschus" }
    },
    {
        keywords: [/angels.*share/i],
        notes: { head: "Cognac", heart: "Zimt, Tonkabohne, Eiche", base: "Praline, Vanille, Sandelholz" }
    },
    {
        keywords: [/love don't be shy/i],
        notes: { head: "Neroli, Bergamotte, rosa Pfeffer, Koriander", heart: "Orangenblüte, Jasmin, Geißblatt, Rose, Iris", base: "Zucker, Vanille, Karamell, Moschus, Zibet" }
    },
    {
        keywords: [/erba pura/i],
        notes: { head: "Sizilianische Orange, kalabrische Bergamotte, sizilianische Zitrone", heart: "Früchte", base: "weißer Moschus, Madagaskar-Vanille, Amber" }
    },
    {
        keywords: [/naxos/i],
        notes: { head: "Lavendel, Bergamotte, Zitrone", heart: "Honig, Zimt, Cashmeran, arabischer Jasmin", base: "Tabakblatt, Tonkabohne, Vanille" }
    },
    {
        keywords: [/alexandria/i],
        notes: { head: "Apfel, Zimt, Rosenholz, Lavendel", heart: "Zeder, Maiglöckchen, bulgarische Rose", base: "Amber, Sandelholz, Moschus, Vanille, Oud" }
    },
    {
        keywords: [/safanad/i],
        notes: { head: "Orange, Birne", heart: "Orangenblüte, Ylang-Ylang, Iris", base: "Vanille, Amber, Sandelholz" }
    },
    {
        keywords: [/grand soir/i],
        notes: { head: "Spanisches Labdanum", heart: "Siam-Benzoe", base: "Tonkabohne, Vanille, Amber" }
    },
    {
        keywords: [/oud satin/i],
        notes: { head: "Veilchen", heart: "Laotisches Oud, bulgarische Rose, türkische Rose", base: "Vanille, Amber" }
    },
    {
        keywords: [/gentle fluidity/i],
        notes: { head: "Wacholderbeere, Muskat", heart: "Koriander", base: "Moschus, Amberhölzer, Vanille" }
    },
    {
        keywords: [/halfeil/i, /halfeti/i],
        notes: { head: "Zypressenblatt, Safran, Kardamom, Artemisia, Bergamotte, Grapefruit", heart: "bulgarische Rose, Muskat, Jasmin", base: "Oud, Leder, Zeder, Sandelholz, Amber, Tonkabohne, Vanille, Moschus" }
    },
    {
        keywords: [/gypsy water/i],
        notes: { head: "Wacholderbeere, Zitrone, Bergamotte, Pfeffer", heart: "Kiefernnadeln, Weihrauch, Iriswurzel", base: "Sandelholz, Vanille, Amber" }
    },
    {
        keywords: [/bal d'afrique/i],
        notes: { head: "Amalfizitronen, Tagetes, schwarze Johannisbeere, Bergamotte, afrikanische Orangenblüte", heart: "Veilchen, Alpenveilchen, Jasmin", base: "Vetiver, Moschus, Amber, Virginiazeder" }
    },
    {
        keywords: [/blanche/i],
        notes: { head: "Aldehyde, Rosa Pfeffer, weiße Rose", heart: "Pfingstrose, Veilchen, afrikanische Orangenblüte", base: "Moschus, holzige Noten, Sandelholz" }
    },
    {
        keywords: [/mojave ghost/i],
        notes: { head: "Sapote, Ambrette", heart: "Magnolie, Veilchen, Sandelholz", base: "Ambergris, Zeder" }
    },
    {
        keywords: [/wood sage/i],
        notes: { head: "Ambrette, Meersalz", heart: "Salbei", base: "Seealgen, Grapefruit" }
    },
    {
        keywords: [/black op/i],
        notes: { head: "Rosa Pfeffer, Orangenblüte, Birne", heart: "Kaffee, Jasmin, Bittermandel, Lakritze", base: "Vanille, Patschuli, Zeder, Kaschmirholz" }
    },
    {
        keywords: [/santal 33/i],
        notes: { head: "Kardamom, Iris, Veilchen", heart: "australisches Sandelholz, Zedernholz, Papyrus", base: "Leder, Amber, Iriswurzel" }
    },
    {
        keywords: [/the noir 29/i],
        notes: { head: "Feige, Lorbeerblatt, Bergamotte", heart: "Zeder, Vetiver, Moschus", base: "Tabak, getrocknete Blätter" }
    },
    {
        keywords: [/another 13/i],
        notes: { head: "Birne, Apfel, Zitrusfrüchte", heart: "Ambrette, Amylsalicylat, Moos, Jasmin", base: "Iso E Super, Cetalox, Ambrettolide, Helvetolide" }
    },
    {
        keywords: [/reflection/i],
        notes: { head: "Rosmarin, roter Pfeffer, Bitterorangenblatt", heart: "Neroli, Iriswurzel, Jasmin, Ylang-Ylang", base: "Vetiver, Patschuli, Sandelholz, Zeder" }
    },
    {
        keywords: [/interlude/i],
        notes: { head: "Oregano, Pfeffer, Bergamotte", heart: "Weihrauch, Opoponax, Amber, Labdanum", base: "Leder, Agarholz (Oud), Sandelholz, Patschuli" }
    },
    {
        keywords: [/chloe/i],
        notes: { head: "Pfingstrose, Litschi, Freesie", heart: "Rose, Maiglöckchen, Magnolie", base: "Virginia Zeder, Amber" }
    },
    {
        keywords: [/light blue/i],
        notes: { head: "Sizilianische Zitrone, Apfel, Zeder, Glockenblume", heart: "Bambus, Jasmin, weiße Rose", base: "Zeder, Moschus, Amber" }
    },
    {
        keywords: [/the one/i],
        notes: { head: "Pfirsich, Litschi, Mandarine, Bergamotte", heart: "Lilie, Pflaume, Jasmin, Maiglöckchen", base: "Vanille, Amber, Moschus, Vetiver" }
    },
    {
        keywords: [/bum bum/i],
        notes: { head: "Pistazie, Mandel", heart: "Heliotrop, Jasminblätter", base: "Vanille, gesalzenes Karamell, Sandelholz" }
    },
    {
        keywords: [/black afghano/i, /black afgano/i],
        notes: { head: "Cannabis, grüne Noten", heart: "Harze, holzige Noten, Kaffee, Tabak", base: "Weihrauch, Oud" }
    },
    {
        keywords: [/acqua di gio/i],
        notes: { head: "Limette, Zitrone, Bergamotte, Jasmin, Orange", heart: "maritime Noten, Calone, Pfirsich, Koriander", base: "Moschus, Zeder, Amber" }
    },
    {
        keywords: [/oud malaki/i],
        notes: { head: "Grapefruit, Lavendel, Beifuß", heart: "Tabak, Leder, Gewürze", base: "Agarholz (Oud), dunkle Hölzer, Ambergris" }
    },
    {
        keywords: [/ombre nomade/i],
        notes: { head: "Oud, Weihrauch", heart: "Himbeere, Rose", base: "Benzoe, Geranie, Safran" }
    },
    {
        keywords: [/kirke/i],
        notes: { head: "Passionsfrucht, Pfirsich, Himbeere, Cassis, Birne", heart: "Maiglöckchen", base: "Heliotrop, Sandelholz, Vanille, Patschuli, Moschus" }
    },
    {
        keywords: [/allure homme sport/i],
        notes: { head: "Aldehyde, Mandarine, Orange, maritime Noten", heart: "Pfeffer, Neroli, Zeder", base: "Tonkabohne, Amber, Vanille, Vetiver, Moschus" }
    },
    {
        keywords: [/tom ford.*oud/i],
        notes: { head: "Rosenholz, Kardamom", heart: "Oud, Sandelholz", base: "Tonkabohne, Amber" }
    },
    {
        keywords: [/gucci guilty/i],
        notes: { head: "Rosa Pfeffer, Mandarine, Bergamotte", heart: "Flieder, Pfirsich, Geranie, Jasmin, schwarze Johannisbeere", base: "Patschuli, Amber, weißer Moschus, Vanille" }
    },
    {
        keywords: [/gucci bloom/i],
        notes: { head: "Jasmin", heart: "Tuberose", base: "Rangunschlinger" }
    },
    {
        keywords: [/flora/i],
        notes: { head: "Pfingstrose, Zitrusfrüchte, Mandarine", heart: "Osmanthus, Rose", base: "Sandelholz, Patschuli, rosa Pfeffer" }
    },
    {
        keywords: [/daisy/i],
        notes: { head: "Veilchenblatt, Blutgrapefruit, Erdbeere", heart: "Veilchen, Gardenie, Jasmin", base: "Moschus, weiße Hölzer, Vanille" }
    },
    {
        keywords: [/alien/i],
        notes: { head: "Indischer Jasmin", heart: "Holzige Noten", base: "Weißer Amber" }
    },
    {
        keywords: [/my way/i],
        notes: { head: "Orangenblüte, Bergamotte", heart: "Tuberose, Jasmin", base: "Vanille, weißer Moschus, Zeder" }
    },
    {
        keywords: [/nomade/i],
        notes: { head: "Mirabelle, Bergamotte, Zitrone, Orange", heart: "Freesie, Pfirsich, Jasmin, Rose", base: "Eichenmoos, Amberwood, Patschuli, weißer Moschus, Sandelholz" }
    },
    {
        keywords: [/libre/i],
        notes: { head: "Lavendel, Mandarine, schwarze Johannisbeere", heart: "Lavendel, Orangenblüte, Jasmin", base: "Vanille, Moschus, Zeder" }
    },
    {
        keywords: [/angel/i],
        notes: { head: "Zuckerwatte, Kokosnuss, Cassis, Melone, Jasmin", heart: "Honig, rote Beeren, Brombeere, Pflaume, Aprikose", base: "Patschuli, Schokolade, Karamell, Vanille, Tonkabohne" }
    },
    {
        keywords: [/roja.*elysium/i, /elysium/i],
        notes: { head: "Grapefruit, Zitrone, Bergamotte, Limette, Thymian, Beifuß, Galbanharz", heart: "Vetiver, Wacholderbeere, schwarze Johannisbeere, Apfel, rosa Pfeffer", base: "Ambergris, Leder, Vanille, Benzoin, Labdanum" }
    },
    {
        keywords: [/roja.*danger/i, /danger/i],
        notes: { head: "Lavendel, Zitrone, Bergamotte, Estragon", heart: "Jasmin, Maiglöckchen, Veilchen", base: "Ambergris, holzige Noten, Patschuli, Eichenmoos, Vanille, Nelke" }
    },
    {
        keywords: [/narciso.*for her/i],
        notes: { head: "Afrikanische Orangenblüte, Osmanthus, Bergamotte", heart: "Moschus, Amber", base: "Vetiver, Vanille, Patschuli" }
    },
    {
        keywords: [/paco rabanne.*million/i, /one million/i],
        notes: { head: "Blutorange, Grapefruit, Minze", heart: "Zimt, Rose, würzige Noten", base: "Amber, Leder, holzige Noten, Patschuli" }
    },
    {
        keywords: [/spicebomb/i],
        notes: { head: "Rosa Pfeffer, Elemi, Bergamotte, Grapefruit", heart: "Zimt, Safran, Paprika", base: "Tabak, Leder, Vetiver" }
    },
    {
        keywords: [/prada.*l'homme/i, /prada lhomme/i],
        notes: { head: "Neroli, schwarzer Pfeffer, Kardamom, Karottensamen", heart: "Iris, Veilchen, Geranie, Mate", base: "Amber, Zeder, Patschuli, Sandelholz" }
    },
    {
        keywords: [/la petite robe noire/i],
        notes: { head: "Schwarze Kirsche, Mandel, rote Beeren, Bergamotte", heart: "Lakritze, Rose, Tee, Taif-Rose", base: "Vanille, Anis, Tonkabohne, Patschuli, Iris" }
    },
    {
        keywords: [/ck one/i],
        notes: { head: "Zitrone, grüne Noten, Bergamotte, Ananas, Mandarine", heart: "Maiglöckchen, Jasmin, Veilchen, Muskat, Rose", base: "Moschus, Zeder, Sandelholz, Eichenmoos, Amber" }
    },
    {
        keywords: [/cool water/i],
        notes: { head: "Maritime Noten, Minze, grüne Noten, Lavendel, Koriander, Rosmarin", heart: "Sandelholz, Jasmin, Neroli, Geranie", base: "Moschus, Eichenmoos, Zeder, Tabak, Amber" }
    },
    {
        keywords: [/joost/i],
        notes: { head: "Frische Noten, Zitrusfrüchte", heart: "Blumige Noten, Gewürze", base: "Hölzer, Moschus, Amber" }
    }
];

// Fallback notes if nothing matched
const genericMen = { head: "Bergamotte, Zitronen, rosa Pfeffer", heart: "Lavendel, würzige Noten", base: "Zedernholz, Moschus, Vetiver" };
const genericWomen = { head: "Fruchtige Noten, Zitrone, Pfirsich", heart: "Jasmin, Rose, blumige Noten", base: "Vanille, Patschuli, weißer Moschus" };
const genericUnisex = { head: "Zitrusfrüchte, Bergamotte, frische Noten", heart: "Jasmin, Gewürze, holzige Akkorde", base: "Amber, Sandelholz, Moschus" };

// Parse and update
let matchCount = 0;
// We will replace the entire objects using a regex on each inspiredBy block

const updatedContent = content.replace(/inspiredBy:\s*"(.*?)",\s*description:\s*"(.*?)",\s*longDescription:\s*"(.*?)",\s*notes:\s*\{\s*head:\s*"(.*?)",\s*heart:\s*"(.*?)",\s*base:\s*"(.*?)"\s*}/g,
    (match, inspiredBy, desc, longDesc, oldHead, oldHeart, oldBase, offset, string) => {
        let newHead = oldHead;
        let newHeart = oldHeart;
        let newBase = oldBase;

        let found = false;
        for (const rule of fragranceNotes) {
            for (const kw of rule.keywords) {
                if (kw.test(inspiredBy)) {
                    newHead = rule.notes.head;
                    newHeart = rule.notes.heart;
                    newBase = rule.notes.base;
                    found = true;
                    matchCount++;
                    break;
                }
            }
            if (found) break;
        }

        // Falls nichts gefunden, generische Noten?
        // Ne, ich schau in den umgebenden Kontext. Wenn wir nichts finden, geben wir ihm wenigstens etwas generisches, was gut klingt.
        if (!found) {
            if (string.substring(0, offset).endsWith('category: "men",\n        ')) {
                newHead = genericMen.head; newHeart = genericMen.heart; newBase = genericMen.base;
            } else if (string.substring(0, offset).endsWith('category: "women",\n        ')) {
                newHead = genericWomen.head; newHeart = genericWomen.heart; newBase = genericWomen.base;
            } else {
                newHead = genericUnisex.head; newHeart = genericUnisex.heart; newBase = genericUnisex.base;
            }
        }

        return `inspiredBy: "${inspiredBy}",
        description: "${desc}",
        longDescription: "${longDesc}",
        notes: { head: "${newHead}", heart: "${newHeart}", base: "${newBase}" }`;
    }
);

fs.writeFileSync('tmp_products_updated.js', updatedContent, 'utf8');
console.log('Update complete. Matched from DB: ' + matchCount);
