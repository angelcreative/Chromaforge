// Ported from ntc.js by Chirag Mehta, modified for this TS project
// Simplified for brevity in this specific implementation to essential logic + data structure

const names: [string, string, ...any[]][] = [
  ['000000', 'Black'],
  ['000080', 'Navy Blue'],
  ['0000C8', 'Dark Blue'],
  ['0000FF', 'Blue'],
  ['000741', 'Stratos'],
  ['001B1C', 'Swamp'],
  ['002387', 'Resolution Blue'],
  ['002900', 'Deep Fir'],
  ['002E20', 'Burnham'],
  ['002FA7', 'International Klein Blue'],
  ['003153', 'Prussian Blue'],
  ['003366', 'Midnight Blue'],
  ['003399', 'Smalt'],
  ['003532', 'Deep Teal'],
  ['003E40', 'Cyprus'],
  ['004620', 'Kaitoke Green'],
  ['0047AB', 'Cobalt'],
  ['004816', 'Crusoe'],
  ['004950', 'Sherpa Blue'],
  ['0056A7', 'Endeavour'],
  ['00581A', 'Camarone'],
  ['0066CC', 'Science Blue'],
  ['0066FF', 'Blue Ribbon'],
  ['00755E', 'Tropical Rain Forest'],
  ['0076A3', 'Allports'],
  ['007BA7', 'Deep Cerulean'],
  ['007EC7', 'Lochmara'],
  ['007FFF', 'Azure Radiance'],
  ['008080', 'Teal'],
  ['0095B6', 'Bondi Blue'],
  ['009DC4', 'Pacific Blue'],
  ['00A693', 'Persian Green'],
  ['00A86B', 'Jade'],
  ['00CC99', 'Caribbean Green'],
  ['00CCCC', 'Robin\'s Egg Blue'],
  ['00FF00', 'Green'],
  ['00FF7F', 'Spring Green'],
  ['00FFFF', 'Cyan / Aqua'],
  ['010D1A', 'Blue Charcoal'],
  ['011635', 'Midnight'],
  ['011D13', 'Holly'],
  ['012731', 'Daintree'],
  ['01361C', 'Cardin Green'],
  ['01371A', 'County Green'],
  ['013E62', 'Astronaut Blue'],
  ['013F6A', 'Regal Blue'],
  ['014B43', 'Aqua Deep'],
  ['015E85', 'Orient'],
  ['016162', 'Blue Stone'],
  ['016D39', 'Fun Green'],
  ['017987', 'Pine Green'],
  ['01826B', 'Blue Lagoon'],
  ['01A368', 'Deep Sea'],
  ['01E577', 'Green Haze'],
  ['022D15', 'English Holly'],
  ['02402C', 'Sherwood Green'],
  ['02478E', 'Congress Blue'],
  ['024E46', 'Evening Sea'],
  ['026395', 'Bahama Blue'],
  ['02866F', 'Observatory'],
  ['02A4D3', 'Cerulean'],
  ['03163C', 'Tangaroa'],
  ['032B52', 'Green Vogue'],
  ['036A6E', 'Mosque'],
  ['041004', 'Midnight Moss'],
  ['041322', 'Black Pearl'],
  ['042E4C', 'Blue Whale'],
  ['044022', 'Zuccini'],
  ['044259', 'Teal Blue'],
  ['051040', 'Deep Cove'],
  ['051657', 'Gulf Blue'],
  ['055989', 'Venice Blue'],
  ['056F57', 'Watercourse'],
  ['062A78', 'Catalina Blue'],
  ['063537', 'Tiber'],
  ['069B81', 'Gossamer'],
  ['06A189', 'Niagara'],
  ['080110', 'Black Magic'],
  ['081910', 'Black Forest'],
  ['082567', 'San Juan'],
  ['088370', 'Turquoise'],
  ['08E8DE', 'Bright Turquoise'],
  ['092256', 'Blue Whale'],
  ['09230F', 'Gordons Green'],
  ['09255D', 'Woodsmoke'],
  ['093624', 'Bottle Green'],
  ['095859', 'Deep Sea Green'],
  ['097F4B', 'Salem'],
  ['0A001C', 'Black Russian'],
  ['0A480D', 'Dark Fern'],
  ['0A6906', 'Japanese Laurel'],
  ['0A6F75', 'Atoll'],
  ['0B0B0B', 'Cod Gray'],
  ['0B0F08', 'Marshland'],
  ['0B1107', 'Gordons Green'],
  ['0B1304', 'Black Ranger'],
  ['0B6207', 'Kelly Green'],
  ['0D0332', 'Black Rock'],
  ['0D1117', 'Bunker'],
  ['0D1C19', 'Aztec'],
  ['0D2E1C', 'Bush'],
  ['0E0E18', 'Cinder'],
  ['0E2A30', 'Firefly'],
  ['0F2D9E', 'Metro'],
  ['10121D', 'Vulcan'],
  ['101405', 'Green Waterloo'],
  ['105852', 'Eden'],
  ['110C6C', 'Jagger'],
  ['120A8F', 'Ultramarine'],
  ['123447', 'Elephant'],
  ['126B40', 'Jewel'],
  ['130000', 'Diesel'],
  ['130A06', 'Asphalt'],
  ['13264D', 'Blue Zodiac'],
  ['134F19', 'Parsley'],
  ['140600', 'Nero'],
  ['1450AA', 'Tory Blue'],
  ['151F4C', 'Bunting'],
  ['1560BD', 'Denim'],
  ['15736B', 'Genoa'],
  ['161928', 'Mirage'],
  ['161D10', 'Hunter Green'],
  ['162A40', 'Big Stone'],
  ['163222', 'Celtic'],
  ['16322C', 'Timber Green'],
  ['163531', 'Gable Green'],
  ['171F04', 'Pine Tree'],
  ['175579', 'Chathams Blue'],
  ['182D09', 'Deep Forest Green'],
  ['18587A', 'Blumine'],
  ['19330E', 'Palm Leaf'],
  ['193751', 'Nile Blue'],
  ['1959A8', 'Fun Blue'],
  ['1A1A68', 'Lucky Point'],
  ['1AB385', 'Mountain Meadow'],
  ['1B0245', 'Tolopea'],
  ['1B1035', 'Haiti'],
  ['1B127B', 'Deep Koamaru'],
  ['1B1404', 'Acadia'],
  ['1B2F11', 'Seaweed'],
  ['1B3162', 'Biscay'],
  ['1B659D', 'Matisse'],
  ['1C1208', 'Crowshead'],
  ['1C1E13', 'Rangoon Green'],
  ['1C39BB', 'Persian Blue'],
  ['1C402E', 'Everglade'],
  ['1C7C7D', 'Elm'],
  ['1D6142', 'Green Pea'],
  ['1E0F04', 'Creole'],
  ['1E161A', 'Karaka'],
  ['1E1708', 'El Paso'],
  ['1E385B', 'Cello'],
  ['1E433C', 'Te Papa Green'],
  ['1E90FF', 'Dodger Blue'],
  ['1F120F', 'Eastern Tan'],
  ['1F6A7D', 'Night Rider'],
  ['1FC2C2', 'Java'],
  ['20208D', 'Jacksons Purple'],
  ['202E54', 'Cloud Burst'],
  ['204852', 'Blue Dianne'],
  ['211A0E', 'Eternity'],
  ['220878', 'Deep Blue'],
  ['228B22', 'Forest Green'],
  ['233418', 'Mallard'],
  ['240A40', 'Violet'],
  ['240C02', 'Kilamanjaro'],
  ['242A1D', 'Log Cabin'],
  ['242E16', 'Black Olive'],
  ['24500F', 'Green House'],
  ['251607', 'Graphite'],
  ['251706', 'Cannon Black'],
  ['251F4F', 'Port Gore'],
  ['25272C', 'Shark'],
  ['25311C', 'Green Kelp'],
  ['2596D1', 'Curious Blue'],
  ['260368', 'Paua'],
  ['26056A', 'Paris M'],
  ['261105', 'Wood Bark'],
  ['261414', 'Gondola'],
  ['262335', 'Steel Gray'],
  ['26283B', 'Ebony Clay'],
  ['273A81', 'Bay of Many'],
  ['27504B', 'Plantation'],
  ['278A5B', 'Eucalyptus'],
  ['281E15', 'Oil'],
  ['283A77', 'Astronaut'],
  ['286ACD', 'Mariner'],
  ['290C5E', 'Violent Violet'],
  ['292130', 'Bastille'],
  ['292319', 'Zeus'],
  ['292937', 'Charade'],
  ['297B9A', 'Jelly Bean'],
  ['29AB87', 'Jungle Green'],
  ['2A0359', 'Cherry Pie'],
  ['2A140E', 'Coffee Bean'],
  ['2A2630', 'Baltic Sea'],
  ['2A380B', 'Turtle Green'],
  ['2A52BE', 'Cerulean Blue'],
  ['2B0202', 'Sepia Black'],
  ['2B194F', 'Valhalla'],
  ['2B3228', 'Heavy Metal'],
  ['2C0E8C', 'Blue Gem'],
  ['2C1632', 'Revolver'],
  ['2C2133', 'Bleached Cedar'],
  ['2C8C84', 'Lochinvar'],
  ['2D2510', 'Mikado'],
  ['2D383A', 'Outer Space'],
  ['2D569B', 'St Tropaz'],
  ['2E0329', 'Jacaranda'],
  ['2E1905', 'Jacko Bean'],
  ['2E3222', 'Rangitoto'],
  ['2E3F62', 'Rhino'],
  ['2E8B57', 'Sea Green'],
  ['2EBFD4', 'Scooter'],
  ['2F270E', 'Onion'],
  ['2F3CB3', 'Governor Bay'],
  ['2F519E', 'Sapphire'],
  ['2F5A57', 'Spectra'],
  ['2F6168', 'Casal'],
  ['3000F5', 'Melrose'],
  ['301F1E', 'Cocoa Brown'],
  ['302A0F', 'Woodrush'],
  ['304B6A', 'San Juan'],
  ['30D5C8', 'Turquoise'],
  ['311C17', 'Eclipse'],
  ['314459', 'Pickled Bluewood'],
  ['315BA1', 'Azure'],
  ['31728D', 'Calypso'],
  ['317D82', 'Paradiso'],
  ['32127A', 'Persian Indigo'],
  ['32293A', 'Blackcurrant'],
  ['323232', 'Mine Shaft'],
  ['325D52', 'Stromboli'],
  ['327C14', 'Bilbao'],
  ['327DA0', 'Astral'],
  ['33036B', 'Christalle'],
  ['33292F', 'Thunder'],
  ['33CC99', 'Shamrock'],
  ['341515', 'Tamarind'],
  ['343F5C', 'Mardi Gras'],
  ['350036', 'Valentino'],
  ['350E42', 'Jagger'],
  ['350E57', 'Tuna'],
  ['353542', 'Chambray'],
  ['354E8C', 'Martinique'],
  ['363050', 'Martinique'],
  ['363534', 'Tuatara'],
  ['363C0D', 'Waiouru'],
  ['36747D', 'Ming'],
  ['368716', 'La Palma'],
  ['370202', 'Chocolate'],
  ['371D09', 'Clinker'],
  ['37290E', 'Brown Tumbleweed'],
  ['373021', 'Birch'],
  ['377475', 'Oracle'],
  ['380474', 'Blue Diamond'],
  ['381A51', 'Grape'],
  ['383533', 'Dune'],
  ['384555', 'Oxford Blue'],
  ['384910', 'Clover'],
  ['394851', 'Limed Spruce'],
  ['396413', 'Dell'],
  ['39A78E', 'Toledo'],
  ['3A0020', 'Sambuca'],
  ['3A2010', 'Jacarta'],
  ['3A2A6A', 'William'],
  ['3A686C', 'Killarney'],
  ['3A6A47', 'Keppel'],
  ['3AB09E', 'Temptress'],
  ['3B000B', 'Aubergine'],
  ['3B0910', 'Jon'],
  ['3B1F1F', 'Treehouse'],
  ['3B2820', 'Amazon'],
  ['3B7A57', 'Boston Blue'],
  ['3B91B4', 'Windsor'],
  ['3C0878', 'Rebel'],
  ['3C1206', 'Meteorite'],
  ['3C1F76', 'Dark Ebony'],
  ['3C2005', 'Camouflage'],
  ['3C3D3E', 'Bright Gray'],
  ['3C493A', 'Cape Cod'],
  ['3C6309', 'Lunar Green'],
  ['3D0C02', 'Bean'],
  ['FFFFFF', 'White']
];

export const ntc = {
  init: function() {
    var color, rgb, hsl;
    for (var i = 0; i < names.length; i++) {
      color = "#" + names[i][0];
      rgb = this.rgb(color);
      hsl = this.hsl(color);
      names[i].push(rgb[0], rgb[1], rgb[2], hsl[0], hsl[1], hsl[2]);
    }
  },

  name: function(color: string) {
    color = color.toUpperCase();
    if (color.length < 3 || color.length > 7)
      return { name: "Invalid Color: " + color, exact: false, hex: color };
    if (color.length % 3 == 0)
      color = "#" + color;
    if (color.length == 4)
      color = "#" + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);

    var rgb = this.rgb(color);
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var hsl = this.hsl(color);
    var h = hsl[0], s = hsl[1], l = hsl[2];
    var ndf1 = 0; var ndf2 = 0; var ndf = 0;
    var cl = -1, df = -1;

    for (var i = 0; i < names.length; i++) {
      if (color == "#" + names[i][0])
        return { name: names[i][1], exact: true, hex: color };

      ndf1 = Math.pow(r - names[i][2], 2) + Math.pow(g - names[i][3], 2) + Math.pow(b - names[i][4], 2);
      ndf2 = Math.pow(h - names[i][5], 2) + Math.pow(s - names[i][6], 2) + Math.pow(l - names[i][7], 2);
      ndf = ndf1 + ndf2 * 2;
      if (df < 0 || df > ndf) {
        df = ndf;
        cl = i;
      }
    }

    return (cl < 0 ? { name: "Invalid Color: " + color, exact: false, hex: color } : { name: names[cl][1], exact: false, hex: color });
  },

  hsl: function(color: string) {
    var rgb = [parseInt('0x' + color.substring(1, 3)) / 255, parseInt('0x' + color.substring(3, 5)) / 255, parseInt('0x' + color.substring(5, 7)) / 255];
    var min, max, delta, h = 0, s = 0, l = 0;
    var r = rgb[0], g = rgb[1], b = rgb[2];

    min = Math.min(r, Math.min(g, b));
    max = Math.max(r, Math.max(g, b));
    delta = max - min;
    l = (min + max) / 2;

    if (l > 0 && l < 1)
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));

    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [parseInt((h * 255).toString()), parseInt((s * 255).toString()), parseInt((l * 255).toString())];
  },

  rgb: function(color: string) {
    return [parseInt('0x' + color.substring(1, 3)), parseInt('0x' + color.substring(3, 5)), parseInt('0x' + color.substring(5, 7))];
  }
};

ntc.init();
