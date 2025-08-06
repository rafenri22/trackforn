import type { Location, TollGate, RouteSegment } from "@/types"

// OSRM API for real routing
const OSRM_BASE_URL = "https://router.project-osrm.org"

// Toll road entrance/exit points in Java (major highways)
export const TOLL_GATES: TollGate[] = [
  { "name": "GT KRAKSAAN", "lat": -7.778106, "lng": 113.401204},
  { "name": "GT PAITON", "lat": -7.732100, "lng": 113.502673},
  { "name": "GT BESUKI", "lat": -7.736874, "lng": 113.720038},
  { "name": "GT SITUBONDO", "lat": -7.699739, "lng": 114.041820},
  { "name": "GT ASEMBAGUS", "lat": -7.755602, "lng": 114.179224},
  { "name": "GT BAJULMATI", "lat": -7.938809, "lng": 114.384457},
  { "name": "GT KETAPANG/BANYUWANGI", "lat": -8.111019, "lng": 114.401736},
  { "name": "GT MARGA ASIH TIMUR", "lat": -6.967544, "lng": 107.547896},
  { "name": "GT MARGA ASIH BARAT", "lat": -6.967663, "lng": 107.543624},
  { "name": "GT KUTAWARINGIN TIMUR", "lat": -6.997648, "lng": 107.535880},
  { "name": "GT KUTAWARINGIN BARAT", "lat": -6.992282, "lng": 107.535536},
  { "name": "GT SOREANG", "lat": -7.010151, "lng": 107.532210},
  { "name": "GT BOGOR 1", "lat": -6.597455, "lng": 106.817616},
  { "name": "GT CIAWI 1", "lat": -6.631129, "lng": 106.838987},
  { "name": "GT SENTUL SELATAN 2", "lat": -6.562483, "lng": 106.842737},
  { "name": "GT SENTUL SELATAN 1", "lat": -6.563932, "lng": 106.844929},
  { "name": "GT CIBUBUR 3", "lat": -6.373200, "lng": 106.896243},
  { "name": "GT CIBUBUR 1", "lat": -6.365806, "lng": 106.895015},
  { "name": "GT CIBUBUR 2", "lat": -6.365289, "lng": 106.894234},
  { "name": "GT CIMANGGIS 2", "lat": -6.382810, "lng": 106.895695},
  { "name": "GT CIMANGGIS 4", "lat": -6.385150, "lng": 106.895552},
  { "name": "GT CIMANGGIS 3", "lat": -6.386769, "lng": 106.896584},
  { "name": "GT CIMANGGIS 5", "lat": -6.387726, "lng": 106.898139},
  { "name": "GT CIMANGGIS 1", "lat": -6.390653, "lng": 106.895260},
  { "name": "GT TAMAN MINI 1", "lat": -6.287112, "lng": 106.878240},
  { "name": "GT TAMAN MINI 2", "lat": -6.287372, "lng": 106.877623},
  { "name": "GT DUKUH 1", "lat": -6.301691, "lng": 106.883554},
  { "name": "GT DUKUH 3", "lat": -6.299842, "lng": 106.883171},
  { "name": "GT UTAMA PASAR REBO", "lat": -6.310145, "lng": 106.884777},
  { "name": "GT DUKUH 2", "lat": -6.303403, "lng": 106.883272},
  { "name": "GT CIMANGGIS UTAMA", "lat": -6.421117, "lng": 106.893741},
  { "name": "GT CIMANGGIS", "lat": -6.421041, "lng": 106.893659},
  { "name": "GT GUNUNG PUTRI ON RAMP", "lat": -6.461260, "lng": 106.889341},
  { "name": "GT GUNUNG PUTRI OFF RAMP", "lat": -6.461449, "lng": 106.889174},
  { "name": "GT KARANGGAN OFF RAMP", "lat": -6.457235, "lng": 106.884046},
  { "name": "GT KARANGGAN ON RAMP", "lat": -6.457187, "lng": 106.884020},
  { "name": "GT CITEUREUP 1", "lat": -6.482461, "lng": 106.874452},
  { "name": "GT CITEUREUP 2", "lat": -6.483423, "lng": 106.873153},
  { "name": "GT SENTUL 1", "lat": -6.528124, "lng": 106.854283},
  { "name": "GT SENTUL 2", "lat": -6.531445, "lng": 106.852579},
  { "name": "GT CIAWI 2", "lat": -6.602257, "lng": 106.831286},
  { "name": "GT BOGOR SELATAN", "lat": -6.613720, "lng": 106.832399},
  { "name": "GT BOGOR 2", "lat": -6.595940, "lng": 106.826462},
  { "name": "GT BANYUMANIK", "lat": -7.065786, "lng": 110.431719},
  { "name": "GT UNGARAN", "lat": -7.138035, "lng": 110.420149},
  { "name": "GT BAWEN", "lat": -7.245740, "lng": 110.446546},
  { "name": "GT SALATIGA", "lat": -7.358600, "lng": 110.533787},
  { "name": "GT BOYOLALI", "lat": -7.527176, "lng": 110.632063},
  { "name": "GT CILANDAK UTAMA", "lat": -6.299853, "lng": 106.804018},
  { "name": "GT CILANDAK", "lat": -6.298771, "lng": 106.803878},
  { "name": "GT KRUKUT 1", "lat": -6.354208, "lng": 106.789135},
  { "name": "GT KRUKUT 4", "lat": -6.356063, "lng": 106.789060},
  { "name": "GT SAWANGAN 1", "lat": -6.392682, "lng": 106.783167},
  { "name": "GT SAWANGAN 4", "lat": -6.392807, "lng": 106.782590},
  { "name": "GT BOJONGGEDE 1", "lat": -6.471068, "lng": 106.794438},
  { "name": "GT BOJONGGEDE 2", "lat": -6.471101, "lng": 106.794003},
  { "name": "GT KRUKUT 1", "lat": -6.363822, "lng": 106.786817},
  { "name": "GT KRUKUT 2", "lat": -6.365021, "lng": 106.793469},
  { "name": "GT LIMAPULUH", "lat": 3.164425, "lng": 99.394588},
  { "name": "GT KISARAN", "lat": 2.955907, "lng": 99.583051},
  { "name": "GT INDUSTRI", "lat": -6.323689, "lng": 106.615951},
  { "name": "GT LEGOK", "lat": -6.316161, "lng": 106.595905},
  { "name": "GT CBD 3", "lat": -6.309662, "lng": 106.641416},
  { "name": "GT CBD 1", "lat": -6.306306, "lng": 106.642455},
  { "name": "GT CBD 2", "lat": -6.307530, "lng": 106.643854},
  { "name": "GT SINGOSARI", "lat": -7.923997, "lng": 112.671978},
  { "name": "GT PAKIS", "lat": -7.956533, "lng": 112.696336},
  { "name": "GT PURWODADI", "lat": -7.799072, "lng": 112.732700},
  { "name": "GT LAWANG", "lat": -7.856804, "lng": 112.699663},
  { "name": "GT MALANG", "lat": -7.978102, "lng": 112.674618},
  { "name": "GT KOPO 1", "lat": -6.955238, "lng": 107.579458},
  { "name": "GT KOPO 2", "lat": -6.955695, "lng": 107.580256},
  { "name": "GT MOH TOHA 1", "lat": -6.956894, "lng": 107.609097},
  { "name": "GT MOH TOHA 2", "lat": -6.956600, "lng": 107.609775},
  { "name": "GT BUAH BATU 1", "lat": -6.961377, "lng": 107.635507},
  { "name": "GT BUAH BATU 2", "lat": -6.961411, "lng": 107.636499},
  { "name": "GT PASIR KOJA 1", "lat": -6.931573, "lng": 107.569735},
  { "name": "GT PASIR KOJA 2", "lat": -6.931468, "lng": 107.570631},
  { "name": "GT BAROS 1", "lat": -6.897442, "lng": 107.541831},
  { "name": "GT PASTEUR 1", "lat": -6.898716, "lng": 107.541313},
  { "name": "GT BAROS 2", "lat": -6.899192, "lng": 107.541752},
  { "name": "GT CILEUNYI", "lat": -6.944224, "lng": 107.749472},
  { "name": "GT PADALARANG", "lat": -6.852710, "lng": 107.500002},
  { "name": "GT PASTEUR 2", "lat": -6.890442, "lng": 107.574546},
  { "name": "GT TALLO TIMUR", "lat": -5.109261, "lng": 119.446160},
  { "name": "GT TAMALANREA", "lat": -5.100182, "lng": 119.460606},
  { "name": "GT PARANGLOE", "lat": -5.095322, "lng": 119.466179},
  { "name": "GT BIRA TIMUR", "lat": -5.090170, "lng": 119.473401},
  { "name": "GT BIRA BARAT", "lat": -5.088141, "lng": 119.482640},
  { "name": "GT BIRINGKANAYA", "lat": -5.075238, "lng": 119.516529},
  { "name": "GT SATELIT TAMALANREA", "lat": -5.099550, "lng": 119.461228},
  { "name": "GT SENTUL BARAT", "lat": -6.564451, "lng": 106.835715},
  { "name": "GT CIBADAK 1", "lat": -6.528532, "lng": 106.765856},
  { "name": "GT CIBADAK 2", "lat": -6.528515, "lng": 106.765490},
  { "name": "GT MUARA ENIM", "lat": -3.623467, "lng": 103.789273},
  { "name": "GT PRABUMULIH", "lat": -3.520932, "lng": 104.262166},
  { "name": "GT NGAWI", "lat": -7.416028, "lng": 111.414242},
  { "name": "GT KARANGANYAR", "lat": -7.521391, "lng": 110.894142},
  { "name": "GT COLOMADU", "lat": -7.534929, "lng": 110.711172},
  { "name": "GT ADI SUMARMO", "lat": -7.505793, "lng": 110.750801},
  { "name": "GT NGEMPLAK", "lat": -7.528186, "lng": 110.799688},
  { "name": "GT GONDANGREJO", "lat": -7.522433, "lng": 110.819243},
  { "name": "GT SRAGEN", "lat": -7.432939, "lng": 110.977934},
  { "name": "GT SRAGEN TIMUR", "lat": -7.378213, "lng": 111.106992},
  { "name": "GT LAMBU KIBANG", "lat": -4.343540, "lng": 105.184594},
  { "name": "GT GUNUNG BATIN", "lat": -4.645670, "lng": 105.197722},
  { "name": "GT MENGGALA", "lat": -4.499828, "lng": 105.177888},
  { "name": "GT WAY KENANGA", "lat": -4.215412, "lng": 105.134847},
  { "name": "GT KAYU AGUNG", "lat": -3.352291, "lng": 104.832000},
  { "name": "GT SIMPANG PEMATANG", "lat": -4.032103, "lng": 105.147267},
  { "name": "GT CAMBAYA", "lat": -5.113217, "lng": 119.426922},
  { "name": "GT KALUKU BODOA", "lat": -5.117450, "lng": 119.441776},
  { "name": "GT TANDES BARAT", "lat": -7.238687, "lng": 112.678085},
  { "name": "GT TANDES TIMUR 2", "lat": -7.240459, "lng": 112.684371},
  { "name": "GT TANDES TIMUR 1", "lat": -7.241046, "lng": 112.684410},
  { "name": "GT ROMOKALISARI", "lat": -7.201960, "lng": 112.645960},
  { "name": "GT KEBOMAS", "lat": -7.162250, "lng": 112.596974},
  { "name": "GT MANYAR", "lat": -7.127990, "lng": 112.603917},
  { "name": "GT SATELIT TANDES TIMUR 1", "lat": -7.241324, "lng": 112.684983},
  { "name": "GT BETUNGAN", "lat": -3.856369, "lng": 102.366831},
  { "name": "GT TABA PENANJUNG", "lat": -3.741410, "lng": 102.446828},
  { "name": "GT BANGIL", "lat": -7.614652, "lng": 112.762081},
  { "name": "GT REMBANG", "lat": -7.638665, "lng": 112.827060},
  { "name": "GT PASURUAN", "lat": -7.663286, "lng": 112.885272},
  { "name": "GT GRATI", "lat": -7.712050, "lng": 112.996021},
  { "name": "GT KRIAN", "lat": -7.366891, "lng": 112.575107},
  { "name": "GT DRIYOREJO 4 RAMP 302", "lat": -7.355462, "lng": 112.625283},
  { "name": "GT DRIYOREJO 3 RAMP 302", "lat": -7.354857, "lng": 112.625368},
  { "name": "GT DRIYOREJO 2 RAMP 305", "lat": -7.353842, "lng": 112.634652},
  { "name": "GT DRIYOREJO 1 RAMP 304", "lat": -7.353322, "lng": 112.634330},
  { "name": "GT WARUGUNUNG", "lat": -7.339734, "lng": 112.679382},
  { "name": "GT PENOMPO", "lat": -7.430746, "lng": 112.451526},
  { "name": "GT WARU 5", "lat": -7.345460, "lng": 112.709454},
  { "name": "GT WARU 4B", "lat": -7.341679, "lng": 112.711791},
  { "name": "GT WARU 6", "lat": -7.341515, "lng": 112.712561},
  { "name": "GT GEMPOL 1", "lat": -7.557772, "lng": 112.714106},
  { "name": "GT GEMPOL 4", "lat": -7.557369, "lng": 112.714407},
  { "name": "GT KEJAPANAN UTAMA", "lat": -7.551965, "lng": 112.690524},
  { "name": "GT DUPAK 1", "lat": -7.241280, "lng": 112.712770},
  { "name": "GT DUPAK 2", "lat": -7.241605, "lng": 112.711942},
  { "name": "GT DUPAK 5", "lat": -7.242936, "lng": 112.712349},
  { "name": "GT DUPAK 4", "lat": -7.242728, "lng": 112.711686},
  { "name": "GT DUPAK 3", "lat": -7.246621, "lng": 112.709704},
  { "name": "GT BANYU URIP", "lat": -7.262932, "lng": 112.707526},
  { "name": "GT KOTA SATELIT", "lat": -7.289974, "lng": 112.702138},
  { "name": "GT GUNUNG SARI 2", "lat": -7.309802, "lng": 112.707966},
  { "name": "GT GUNUNG SARI 1", "lat": -7.307669, "lng": 112.708564},
  { "name": "GT WARU 1", "lat": -7.345725, "lng": 112.713034},
  { "name": "GT WARU UTAMA", "lat": -7.347696, "lng": 112.710446},
  { "name": "GT SIDOARJO 2", "lat": -7.444613, "lng": 112.697380},
  { "name": "GT SIDOARJO 1", "lat": -7.446171, "lng": 112.699460},
  { "name": "GT PORONG", "lat": -7.507369, "lng": 112.699251},
  { "name": "GT KRAPYAK 2", "lat": -6.990508, "lng": 110.369131},
  { "name": "GT KRAPYAK 1", "lat": -6.994945, "lng": 110.368783},
  { "name": "GT MANYARAN", "lat": -7.005559, "lng": 110.377383},
  { "name": "GT JATINGALEH 2", "lat": -7.031190, "lng": 110.414938},
  { "name": "GT JATINGALEH 1", "lat": -7.031328, "lng": 110.421142},
  { "name": "GT TEMBALANG", "lat": -7.049663, "lng": 110.433481},
  { "name": "GT SRONDOL", "lat": -7.056396, "lng": 110.423572},
  { "name": "GT GAYAMSARI", "lat": -6.999111, "lng": 110.450946},
  { "name": "GT MUKTIHARJO", "lat": -6.973110, "lng": 110.450032},
  { "name": "GT PEMALANG", "lat": -6.914425, "lng": 109.433584},
  { "name": "GT BATANG", "lat": -6.941533, "lng": 109.697993},
  { "name": "GT PEKALONGAN", "lat": -6.947226, "lng": 109.603195},
  { "name": "GT CIKUPA", "lat": -6.205479, "lng": 106.523699},
  { "name": "GT CIKUPA", "lat": -6.205634, "lng": 106.522615},
  { "name": "GT CIKUPA 3", "lat": -6.204443, "lng": 106.521515},
  { "name": "GT CIKUPA 2", "lat": -6.205093, "lng": 106.520807},
  { "name": "GT BALARAJA TIMUR", "lat": -6.204201, "lng": 106.485066},
  { "name": "GT BALARAJA BARAT", "lat": -6.200021, "lng": 106.459108},
  { "name": "GT CIKANDE", "lat": -6.175274, "lng": 106.343970},
  { "name": "GT CIUJUNG", "lat": -6.141363, "lng": 106.286489},
  { "name": "GT SERANG TIMUR", "lat": -6.116146, "lng": 106.182973},
  { "name": "GT CILEGON TIMUR", "lat": -6.023254, "lng": 106.089040},
  { "name": "GT SERANG BARAT", "lat": -6.090697, "lng": 106.136106},
  { "name": "GT CIUJUNG ON RAMP", "lat": -6.141022, "lng": 106.287655},
  { "name": "GT CILEGON BARAT", "lat": -5.983789, "lng": 106.033417},
  { "name": "GT CILEGON BARAT 1", "lat": -5.984455, "lng": 106.033166},
  { "name": "GT MERAK", "lat": -5.973075, "lng": 106.008641},
  { "name": "GT CIKUPA 3", "lat": -6.205720, "lng": 106.520902},
  { "name": "GT MARUNDA", "lat": -6.116771, "lng": 106.976525},
  { "name": "GT CIBITUNG 1", "lat": -6.287127, "lng": 107.083479},
  { "name": "GT CIBITUNG 3", "lat": -6.283032, "lng": 107.075214},
  { "name": "GT TARUMAJAYA", "lat": -6.108295, "lng": 106.991062},
  { "name": "GT TAMBELANG", "lat": -6.187076, "lng": 107.068395},
  { "name": "GT TELAGA ASIH", "lat": -6.269544, "lng": 107.096871},
  { "name": "GT CIBITUNG 7", "lat": -6.286096, "lng": 107.079579},
  { "name": "GT CIBITUNG 2", "lat": -6.285883, "lng": 107.085409},
  { "name": "GT CIBITUNG 9", "lat": -6.288027, "lng": 107.081736},
  { "name": "GT CIBITUNG 5", "lat": -6.287661, "lng": 107.083032},
  { "name": "GT CIBITUNG 8", "lat": -6.286272, "lng": 107.080715},
  { "name": "GT CIBITUNG 4", "lat": -6.285496, "lng": 107.081037},
  { "name": "GT CIBITUNG 6", "lat": -6.285913, "lng": 107.084546},
  { "name": "GT SEMPER", "lat": -6.134476, "lng": 106.937251},
  { "name": "GT CISALAK 3", "lat": -6.380675, "lng": 106.864530},
  { "name": "GT CISALAK 4", "lat": -6.381007, "lng": 106.861991},
  { "name": "GT MARGONDA 2", "lat": -6.379254, "lng": 106.840249},
  { "name": "GT MARGONDA 3", "lat": -6.377841, "lng": 106.835685},
  { "name": "GT MARGONDA 1", "lat": -6.376796, "lng": 106.834732},
  { "name": "GT KUKUSAN 1", "lat": -6.369781, "lng": 106.815398},
  { "name": "GT KUKUSAN 2", "lat": -6.370176, "lng": 106.814880},
  { "name": "GT CISALAK 1", "lat": -6.381953, "lng": 106.872851},
  { "name": "GT KUKUSAN 4", "lat": -6.368428, "lng": 106.811804},
  { "name": "GT KUKUSAN 3", "lat": -6.368875, "lng": 106.811529},
  { "name": "GT KRUKUT 4", "lat": -6.365477, "lng": 106.792782},
  { "name": "GT KRUKUT 5", "lat": -6.365265, "lng": 106.791647},
  { "name": "GT CISALAK 2", "lat": -6.382195, "lng": 106.871570},
  { "name": "GT LIMO 1", "lat": -6.360703, "lng": 106.773521},
  { "name": "GT LIMO 2", "lat": -6.362996, "lng": 106.773731},
  { "name": "GT KRUKUT 27", "lat": -6.362814, "lng": 106.786167},
  { "name": "GT BINTARO 2", "lat": -6.273044, "lng": 106.748606},
  { "name": "GT BUARAN INDAH 2", "lat": -6.181481, "lng": 106.652646},
  { "name": "GT PINANG 2", "lat": -6.208059, "lng": 106.657009},
  { "name": "GT PINANG 1", "lat": -6.208230, "lng": 106.657804},
  { "name": "GT KUNCIRAN 7", "lat": -6.215584, "lng": 106.665340},
  { "name": "GT KUNCIRAN 6", "lat": -6.216531, "lng": 106.668194},
  { "name": "GT PINANG 4", "lat": -6.205547, "lng": 106.656139},
  { "name": "GT PINANG 3", "lat": -6.205099, "lng": 106.655423},
  { "name": "GT BUARAN INDAH 1", "lat": -6.180760, "lng": 106.653468},
  { "name": "GT TANAH TINGGI 2", "lat": -6.168228, "lng": 106.653276},
  { "name": "GT TANAH TINGGI 1", "lat": -6.167737, "lng": 106.653905},
  { "name": "GT BENDA UTAMA", "lat": -6.135509, "lng": 106.681669},
  { "name": "GT KUNCIRAN 8", "lat": -6.218509, "lng": 106.665751},
  { "name": "GT KARTASURA", "lat": -7.548873, "lng": 110.701455},
  { "name": "GT KARANGANOM", "lat": -7.644941, "lng": 110.668926},
  { "name": "GT KLATEN", "lat": -7.678530, "lng": 110.598400},
  { "name": "GT PRAMBANAN", "lat": -7.726745, "lng": 110.533253},
  { "name": "GT MANISRENGGO", "lat": -7.703413, "lng": 110.522728},
  { "name": "GT PURWOMARTANI", "lat": -7.772426, "lng": 110.464285},
  { "name": "GT GAMPING", "lat": -7.799333, "lng": 110.306945},
  { "name": "GT SENTOLO", "lat": -7.817896, "lng": 110.220455},
  { "name": "GT WATES", "lat": -7.845978, "lng": 110.160361},
  { "name": "GT KULON PROGO", "lat": -7.878058, "lng": 110.060347},
  { "name": "GT GANDUS", "lat": -3.008108, "lng": 104.668857},
  { "name": "GT SUNGAI RENGAS", "lat": -2.932729, "lng": 104.621235},
  { "name": "GT PULAU RIMO", "lat": -2.907013, "lng": 104.517407},
  { "name": "GT SIRAN PULAU PADANG", "lat": -3.259133, "lng": 104.841905},
  { "name": "GT JEJAWI", "lat": -3.199630, "lng": 104.841129},
  { "name": "GT KRAMASSAN", "lat": -3.071098, "lng": 104.736269},
  { "name": "GT PANGKALAN BALAI", "lat": -2.845059, "lng": 104.358775},
  { "name": "GT BELAWAN", "lat": 3.729793, "lng": 98.681036},
  { "name": "GT MABAR 2", "lat": 3.674144, "lng": 98.678761},
  { "name": "GT HAJI ANIF 2", "lat": 3.634382, "lng": 98.708676},
  { "name": "GT HAJI ANIF 1", "lat": 3.638301, "lng": 98.708878},
  { "name": "GT BANDAR SELAMAT 3", "lat": 3.595802, "lng": 98.723780},
  { "name": "GT BANDAR SELAMAT 4", "lat": 3.595619, "lng": 98.724324},
  { "name": "GT BANDAR SELAMAT 2", "lat": 3.599202, "lng": 98.723623},
  { "name": "GT BANDAR SELAMAT 1", "lat": 3.599005, "lng": 98.724236},
  { "name": "GT TANJUNG MOROWA", "lat": 3.526210, "lng": 98.774980},
  { "name": "GT AMPLAS", "lat": 3.537460, "lng": 98.721856},
  { "name": "GT TANJUNG MULIA", "lat": 3.646117, "lng": 98.680003},
  { "name": "GT MABAR 1", "lat": 3.674452, "lng": 98.681769},
  { "name": "GT SUMBERJAYA", "lat": -6.704697, "lng": 108.312645},
  { "name": "GT PALIMANAN", "lat": -6.689885, "lng": 108.417152},
  { "name": "GT PALIMANAN 1", "lat": -6.690065, "lng": 108.426706},
  { "name": "GT PALIMANAN 2", "lat": -6.689637, "lng": 108.426760},
  { "name": "GT KALIJATI", "lat": -6.509173, "lng": 107.678718},
  { "name": "GT SUBANG", "lat": -6.531885, "lng": 107.783615},
  { "name": "GT CIKEDUNG", "lat": -6.619119, "lng": 108.015182},
  { "name": "GT KERTAJATI - BANDARA", "lat": -6.693788, "lng": 108.173239},
  { "name": "GT KERTAJATI", "lat": -6.708210, "lng": 108.169492},
  { "name": "GT CIGOMBONG", "lat": -6.760057, "lng": 106.802145},
  { "name": "GT CIGOMBONG 1", "lat": -6.753714, "lng": 106.803555},
  { "name": "GT CIBADAK", "lat": -6.862628, "lng": 106.777447},
  { "name": "GT PALARAN OFF", "lat": -0.588165, "lng": 117.142408},
  { "name": "GT PALARAN ON", "lat": -0.588012, "lng": 117.142570},
  { "name": "GT KARANG JOANG", "lat": -1.163033, "lng": 116.887039},
  { "name": "GT MANGGAR ON", "lat": -1.219314, "lng": 116.947608},
  { "name": "GT MANGGAR OFF", "lat": -1.219186, "lng": 116.947657},
  { "name": "GT PANDAAN", "lat": -7.665683, "lng": 112.704521},
  { "name": "GT GEMPOL 3", "lat": -7.567441, "lng": 112.716152},
  { "name": "GT GEMPOL 2", "lat": -7.567291, "lng": 112.715670},
  { "name": "GT SEMPER 1", "lat": -6.139357, "lng": 106.937946},
  { "name": "GT ROROTAN 2", "lat": -6.146118, "lng": 106.940250},
  { "name": "GT PULOGEBANG", "lat": -6.213061, "lng": 106.951905},
  { "name": "GT BINTARA", "lat": -6.221474, "lng": 106.950139},
  { "name": "GT BAMBU APUS 2", "lat": -6.307543, "lng": 106.895628},
  { "name": "GT BAMBU APUS 1", "lat": -6.310196, "lng": 106.900910},
  { "name": "GT SETU", "lat": -6.312200, "lng": 106.910354},
  { "name": "GT JATIASIH 2", "lat": -6.297357, "lng": 106.954907},
  { "name": "GT JATIASIH 1", "lat": -6.295655, "lng": 106.955521},
  { "name": "GT KALIMALANG 2", "lat": -6.246440, "lng": 106.955725},
  { "name": "GT KALIMALANG 1", "lat": -6.241703, "lng": 106.953365},
  { "name": "GT CAKUNG 1", "lat": -6.187145, "lng": 106.938447},
  { "name": "GT CAKUNG 2", "lat": -6.178075, "lng": 106.943265},
  { "name": "GT JATIWARNA 1", "lat": -6.310006, "lng": 106.927039},
  { "name": "GT CIKUNIR 2", "lat": -6.256793, "lng": 106.960114},
  { "name": "GT CIKUNIR 3", "lat": -6.256867, "lng": 106.954725},
  { "name": "GT CIKUNIR 4", "lat": -6.256418, "lng": 106.954691},
  { "name": "GT CIKUNIR 8", "lat": -6.257749, "lng": 106.959034},
  { "name": "GT CIKUNIR 1", "lat": -6.253350, "lng": 106.958061},
  { "name": "GT GEDONG 1", "lat": -6.308075, "lng": 106.868907},
  { "name": "GT GEDONG 2", "lat": -6.305663, "lng": 106.861876},
  { "name": "GT PONDOK PINANG", "lat": -6.290639, "lng": 106.781861},
  { "name": "GT HELVETIA", "lat": 3.630009, "lng": 98.632640},
  { "name": "GT BINJAI", "lat": 3.645316, "lng": 98.540026},
  { "name": "GT SEMAYANG", "lat": 3.631451, "lng": 98.580545},
  { "name": "GT PALIMANAN 3", "lat": -6.689584, "lng": 108.430594},
  { "name": "GT PALIMANAN 4", "lat": -6.689999, "lng": 108.430712},
  { "name": "GT PLUMBON 2", "lat": -6.699125, "lng": 108.485208},
  { "name": "GT PLUMBON 1", "lat": -6.702091, "lng": 108.485828},
  { "name": "GT CIPERNA BARAT", "lat": -6.760238, "lng": 108.529301},
  { "name": "GT CIPERNA TIMUR", "lat": -6.766618, "lng": 108.527497},
  { "name": "GT KANCI", "lat": -6.799533, "lng": 108.622468},
  { "name": "GT JATIKARYA 2", "lat": -6.382520, "lng": 106.918540},
  { "name": "GT JATIKARYA 1", "lat": -6.382035, "lng": 106.918122},
  { "name": "GT CIKEAS", "lat": -6.383538, "lng": 106.945552},
  { "name": "GT SETU SELATAN", "lat": -6.350961, "lng": 107.024745},
  { "name": "GT NAROGONG", "lat": -6.377508, "lng": 106.972215},
  { "name": "GT CIBITUNG 1", "lat": -6.288020, "lng": 107.081754},
  { "name": "GT CIBITUNG 2", "lat": -6.286073, "lng": 107.079542},
  { "name": "GT JEMBATAN TIGA 1", "lat": -6.132560, "lng": 106.791283},
  { "name": "GT JEMBATAN TIGA 2", "lat": -6.132257, "lng": 106.794283},
  { "name": "GT GEDONG PANJANG 1", "lat": -6.131901, "lng": 106.804322},
  { "name": "GT GEDONG PANJANG 2", "lat": -6.130935, "lng": 106.807139},
  { "name": "GT ANCOL BARAT", "lat": -6.131417, "lng": 106.824951},
  { "name": "GT ANCOL TIMUR", "lat": -6.125675, "lng": 106.851114},
  { "name": "GT JATINEGARA", "lat": -6.210228, "lng": 106.873800},
  { "name": "GT RAWAMANGUN", "lat": -6.201476, "lng": 106.873433},
  { "name": "GT PULOMAS", "lat": -6.182987, "lng": 106.875464},
  { "name": "GT CEMPAKA PUTIH", "lat": -6.172230, "lng": 106.877191},
  { "name": "GT PISANGAN", "lat": -6.227185, "lng": 106.875053},
  { "name": "GT KEBON NANAS", "lat": -6.235408, "lng": 106.877132},
  { "name": "GT PEDATI", "lat": -6.224334, "lng": 106.874922},
  { "name": "GT SUNTER", "lat": -6.158967, "lng": 106.883381},
  { "name": "GT PODOMORO", "lat": -6.148660, "lng": 106.889596},
  { "name": "GT TANJUNG PRIOK 1", "lat": -6.132776, "lng": 106.892832},
  { "name": "GT TANJUNG PRIOK 2", "lat": -6.131826, "lng": 106.891217},
  { "name": "GT KEMAYORAN", "lat": -6.130857, "lng": 106.846127},
  { "name": "GT PLUIT", "lat": -6.125959, "lng": 106.777638},
  { "name": "GT KEBON BAWANG", "lat": -6.119566, "lng": 106.893366},
  { "name": "GT LENTENG AGUNG 1", "lat": -6.303645, "lng": 106.844729},
  { "name": "GT LENTENG AGUNG 4", "lat": -6.300960, "lng": 106.835049},
  { "name": "GT LENTENG AGUNG GATE 3", "lat": -6.301077, "lng": 106.835236},
  { "name": "GT LENTENG AGUNG 2", "lat": -6.301277, "lng": 106.835493},
  { "name": "GT LENTENG AGUNG GATE 1", "lat": -6.301399, "lng": 106.835682},
  { "name": "GT AMPERA 1", "lat": -6.292449, "lng": 106.819245},
  { "name": "GT AMPERA 2", "lat": -6.292336, "lng": 106.813441},
  { "name": "GT CIPUTAT 1", "lat": -6.284014, "lng": 106.774571},
  { "name": "GT CIPUTAT 2", "lat": -6.284272, "lng": 106.774742},
  { "name": "GT KAMPUNG RAMBUTAN 1", "lat": -6.307195, "lng": 106.877769},
  { "name": "GT KAMPUNG RAMBUTAN 2", "lat": -6.307367, "lng": 106.877234},
  { "name": "GT LENTENG AGUNG 3", "lat": -6.304036, "lng": 106.848450},
  { "name": "GT FATMAWATI 2", "lat": -6.292390, "lng": 106.791484},
  { "name": "GT FATMAWATI 1", "lat": -6.292116, "lng": 106.797977},
  { "name": "GT KAYU BESAR 1", "lat": -6.129489, "lng": 106.730144},
  { "name": "GT KAYU BESAR 2", "lat": -6.129935, "lng": 106.730232},
  { "name": "GT RAWA BUAYA UTARA", "lat": -6.152011, "lng": 106.727315},
  { "name": "GT RAWA BUAYA SELATAN", "lat": -6.157437, "lng": 106.727572},
  { "name": "GT KEMBANGAN UTARA 2", "lat": -6.181006, "lng": 106.728878},
  { "name": "GT KEMBANGAN UTARA 1", "lat": -6.181433, "lng": 106.728988},
  { "name": "GT KAMAL UTAMA", "lat": -6.116798, "lng": 106.734601},
  { "name": "GT HALIM UTAMA", "lat": -6.245264, "lng": 106.888762},
  { "name": "GT HALIM 2", "lat": -6.246357, "lng": 106.887382},
  { "name": "GT CAWANG", "lat": -6.243324, "lng": 106.859805},
  { "name": "GT CILILITAN UTAMA", "lat": -6.267075, "lng": 106.872905},
  { "name": "GT CILILITAN 2", "lat": -6.266069, "lng": 106.872722},
  { "name": "GT CILILITAN 3", "lat": -6.265507, "lng": 106.873040},
  { "name": "GT TEBET 1", "lat": -6.242483, "lng": 106.840499},
  { "name": "GT TEBET 2", "lat": -6.243133, "lng": 106.849764},
  { "name": "GT KUNINGAN 2", "lat": -6.240857, "lng": 106.835186},
  { "name": "GT KUNINGAN 1", "lat": -6.234109, "lng": 106.822858},
  { "name": "GT SENAYAN", "lat": -6.215024, "lng": 106.809187},
  { "name": "GT TOMANG", "lat": -6.181589, "lng": 106.793537},
  { "name": "GT SLIPI 1", "lat": -6.199968, "lng": 106.798635},
  { "name": "GT SLIPI 2", "lat": -6.195197, "lng": 106.797527},
  { "name": "GT PEJOMPONGAN", "lat": -6.206743, "lng": 106.802819},
  { "name": "GT SEMANGGI 2", "lat": -6.229990, "lng": 106.819770},
  { "name": "GT SEMANGGI 1", "lat": -6.223732, "lng": 106.815515},
  { "name": "GT JELAMBAR 1", "lat": -6.157679, "lng": 106.791910},
  { "name": "GT JELAMBAR 2", "lat": -6.156485, "lng": 106.792921},
  { "name": "GT ANGKE 1", "lat": -6.140566, "lng": 106.787311},
  { "name": "GT ANGKE 2", "lat": -6.144460, "lng": 106.789793},
  { "name": "GT TANJUNG DUREN", "lat": -6.173282, "lng": 106.790307},
  { "name": "GT PLUIT 3", "lat": -6.124573, "lng": 106.779877},
  { "name": "GT CIKAMUNING", "lat": -6.818262, "lng": 107.480769},
  { "name": "GT JATILUHUR", "lat": -6.566581, "lng": 107.429390},
  { "name": "GT KALIHURIP UTAMA 1 SATELIT", "lat": -6.431478, "lng": 107.424818},
  { "name": "GT KALIHURIP UTAMA 1", "lat": -6.429156, "lng": 107.424694},
  { "name": "GT KALIHURIP UTAMA 3", "lat": -6.424165, "lng": 107.427288},
  { "name": "GT SADANG", "lat": -6.498171, "lng": 107.447402},
  { "name": "GT KALIHURIP UTAMA 4", "lat": -6.425543, "lng": 107.424313},
  { "name": "GT KALIHURIP UTAMA 2 SATELIT", "lat": -6.424991, "lng": 107.424421},
  { "name": "GT KALIHURIP UTAMA 2", "lat": -6.429062, "lng": 107.424702},
  { "name": "GT PONDOK AREN BARAT 1", "lat": -6.289315, "lng": 106.726152},
  { "name": "GT PONDOK AREN BARAT 2", "lat": -6.289765, "lng": 106.726581},
  { "name": "GT KUNCIRAN 1", "lat": -6.220101, "lng": 106.668677},
  { "name": "GT KUNCIRAN 2", "lat": -6.219931, "lng": 106.669175},
  { "name": "GT JELUMPANG", "lat": -6.267002, "lng": 106.674939},
  { "name": "GT PARIGI", "lat": -6.266920, "lng": 106.685534},
  { "name": "GT SERPONG 3", "lat": -6.304020, "lng": 106.699362},
  { "name": "GT SERPONG 2", "lat": -6.302011, "lng": 106.700134},
  { "name": "GT SERPONG 4", "lat": -6.301853, "lng": 106.700610},
  { "name": "GT SERPONG 1", "lat": -6.300767, "lng": 106.703865},
  { "name": "GT CIKEUSAL", "lat": -6.214969, "lng": 106.259247},
  { "name": "GT PETIR", "lat": -6.286581, "lng": 106.254802},
  { "name": "GT CILELES", "lat": -6.473410, "lng": 106.059691},
  { "name": "GT CIKULUR", "lat": -6.418261, "lng": 106.152632},
  { "name": "GT RANGKASBITUNG", "lat": -6.350028, "lng": 106.222037},
  { "name": "GT GUNUNG SUGIH", "lat": -4.959219, "lng": 105.222142},
  { "name": "GT TERBANGGI BESAR", "lat": -4.881857, "lng": 105.225201},
  { "name": "GT BAKAUHENI UTARA", "lat": -5.806735, "lng": 105.726361},
  { "name": "GT PELABUHAN", "lat": -5.866534, "lng": 105.755429},
  { "name": "GT BAKAUHENI SELATAN", "lat": -5.842837, "lng": 105.728026},
  { "name": "GT KALIANDA", "lat": -5.693558, "lng": 105.617603},
  { "name": "GT SIDOMULYO", "lat": -5.612114, "lng": 105.547832},
  { "name": "GT LEMATANG", "lat": -5.405266, "lng": 105.346800},
  { "name": "GT KOTABARU", "lat": -5.358279, "lng": 105.327426},
  { "name": "GT NATAR", "lat": -5.277374, "lng": 105.210289},
  { "name": "GT TEGINENENG TIMUR", "lat": -5.168830, "lng": 105.219830},
  { "name": "GT TEGINENENG BARAT", "lat": -5.158747, "lng": 105.187979},
  { "name": "GT LEGOK", "lat": -6.782611, "lng": 108.000617},
  { "name": "GT UJUNGJAYA", "lat": -6.716524, "lng": 108.090930},
  { "name": "GT DAWUAN", "lat": -6.691248, "lng": 108.112936},
  { "name": "GT CIMALAKA", "lat": -6.801770, "lng": 107.940421},
  { "name": "GT LEBANI GRESIK", "lat": -7.389317, "lng": 112.544899},
  { "name": "GT EXIT BELAHANREJO", "lat": -7.329804, "lng": 112.534248},
  { "name": "GT exit BELAHANREJO", "lat": -7.329206, "lng": 112.533648},
  { "name": "GT exit CERME", "lat": -7.216776, "lng": 112.575164},
  { "name": "GT EXIT CERME", "lat": -7.216609, "lng": 112.574344},
  { "name": "GT exit BUNDER", "lat": -7.171743, "lng": 112.595530},
  { "name": "GT EXIT BUNDER", "lat": -7.171807, "lng": 112.594972},
  { "name": "GT NGANJUK", "lat": -7.577479, "lng": 111.918157},
  { "name": "GT CARUBAN", "lat": -7.519748, "lng": 111.627955},
  { "name": "GT MADIUN", "lat": -7.551261, "lng": 111.550817},
  { "name": "GT PALEMBANG", "lat": -3.060324, "lng": 104.753365},
  { "name": "GT PAMULUTAN", "lat": -3.105694, "lng": 104.722405},
  { "name": "GT RAMBUTAN", "lat": -3.147090, "lng": 104.703693},
  { "name": "GT INDRALAYA", "lat": -3.212249, "lng": 104.679751},
    { "name": "GT TONGAS", "lat": -7.749582, "lng": 113.100279},
    { "name": "GT PROBOLINGGO BARAT", "lat": -7.788910, "lng": 113.155788},
    { "name": "GT PROBOLINGGO TIMUR", "lat": -7.834142, "lng": 113.231308},
    { "name": "GT GENDING", "lat": -7.813397, "lng": 113.306756},
    { "name": "GT PEKANBARU", "lat": 0.643390, "lng": 101.446996},
    { "name": "GT PINGGIR", "lat": 1.211944, "lng": 101.251383},
    { "name": "GT KANDIS UTARA", "lat": 0.972800, "lng": 101.251533},
    { "name": "GT DUMAI", "lat": 1.576519, "lng": 101.395470},
    { "name": "GT BATHIN SOLAPAN", "lat": 1.425492, "lng": 101.268117},
    { "name": "GT KANDIS SELATAN", "lat": 0.857831, "lng": 101.279581},
    { "name": "GT MINAS", "lat": 0.721493, "lng": 101.446198},
    { "name": "GT TAMBAK SUMUR 1", "lat": -7.347005, "lng": 112.789261},
    { "name": "GT MENANGGAL", "lat": -7.344662, "lng": 112.734728},
    { "name": "GT BERBEK 2", "lat": -7.343156, "lng": 112.752388},
    { "name": "GT BERBEK 1", "lat": -7.342682, "lng": 112.758088},
    { "name": "GT TAMBAK SUMUR 2", "lat": -7.346177, "lng": 112.783935},
    { "name": "GT JUANDA", "lat": -7.357758, "lng": 112.804988},
    { "name": "GT JATI ASIH", "lat": -6.299530, "lng": 106.951303},
    { "name": "GT BANTAR GEBANG", "lat": -6.320320, "lng": 106.990341},
    { "name": "GT SETU", "lat": -6.342045, "lng": 107.029489},
    { "name": "GT SUKARAGAM", "lat": -6.390695, "lng": 107.097214},
    { "name": "GT SUKABUNGAH", "lat": -6.424593, "lng": 107.194199},
    { "name": "GT KUTANEGARA", "lat": -6.455837, "lng": 107.390006},
    { "name": "GT SAMBA", "lat": -6.499632, "lng": 107.450310},
    { "name": "UNKNOWN_457", "lat": -7.653935, "lng": 111.984681},
    { "name": "UNKNOWN_458", "lat": -7.656331, "lng": 111.983847},
    { "name": "GT PADANG", "lat": -0.793467, "lng": 100.331367},
    { "name": "GT KAYUTANAM_1", "lat": -0.529134, "lng": 100.305161},
    { "name": "GT KAYUTANAM_2", "lat": -0.528134, "lng": 100.305971},
    { "name": "GT PARBARAKAN_1", "lat": 3.386330, "lng": 99.160819},
    { "name": "GT TEBING TINGGI", "lat": 3.385812, "lng": 99.143074},
    { "name": "GT BANGKINANG", "lat": 0.384300, "lng": 101.021539},
    { "name": "GT XII KOTO KAMPAR", "lat": 0.318135, "lng": 100.826327},
    { "name": "GT KAPUK", "lat": -6.121769, "lng": 106.768783},
    { "name": "GT KAPUK 2", "lat": -6.121546, "lng": 106.769630},
    { "name": "GT KAMAL 1", "lat": -6.118961, "lng": 106.735116},
    { "name": "GT KAMAL 2", "lat": -6.115605, "lng": 106.734274},
    { "name": "GT KAMAL 3", "lat": -6.116164, "lng": 106.734144},
    { "name": "GT KAMAL 4", "lat": -6.117759, "lng": 106.734296},
    { "name": "GT PLUIT 1", "lat": -6.127367, "lng": 106.778787},
    { "name": "GT PLUIT 2", "lat": -6.125957, "lng": 106.777617},
    { "name": "GT PLUIT 3", "lat": -6.124583, "lng": 106.779873},
    { "name": "GT CENGKARENG", "lat": -6.105803, "lng": 106.696339},
    { "name": "GT CENGKARENG 2", "lat": -6.105168, "lng": 106.697739},
    { "name": "GT KAMAL UTAMA", "lat": -6.116805, "lng": 106.734597},
    { "name": "GT VETERAN 2", "lat": -6.259608, "lng": 106.765833},
    { "name": "GT VETERAN", "lat": -6.263993, "lng": 106.768012},
    { "name": "GT CIPUTAT 2", "lat": -6.276842, "lng": 106.768284},
    { "name": "GT CIPUTAT 1", "lat": -6.284010, "lng": 106.774580},
    { "name": "GT CILEDUG 3", "lat": -6.240361, "lng": 106.758588},
    { "name": "GT CILEDUG 1", "lat": -6.239119, "lng": 106.758290},
    { "name": "GT CILEDUG 2", "lat": -6.233600, "lng": 106.754847},
    { "name": "GT CILEDUG 4", "lat": -6.232630, "lng": 106.754171},
    { "name": "GT JOGLO 3", "lat": -6.221999, "lng": 106.747717},
    { "name": "GT JOGLO 2", "lat": -6.216378, "lng": 106.744046},
    { "name": "GT JOGLO 4", "lat": -6.215569, "lng": 106.743565},
    { "name": "GT MERUYA SELATAN 1", "lat": -6.208738, "lng": 106.740216},
    { "name": "GT MERUYA SELATAN 2", "lat": -6.204140, "lng": 106.737280},
    { "name": "GT MERUYA UTAMA 1", "lat": -6.193945, "lng": 106.732715},
    { "name": "GT KARAWACI BARAT", "lat": -6.226818, "lng": 106.614048},
    { "name": "GT KARAWACI 1", "lat": -6.226620, "lng": 106.616433},
    { "name": "GT KARAWACI 2", "lat": -6.224759, "lng": 106.616496},
    { "name": "GT KARAWACI TIMUR", "lat": -6.223065, "lng": 106.621625},
    { "name": "GT TANGERANG 2", "lat": -6.221607, "lng": 106.637829},
    { "name": "GT TANGERANG UTAMA", "lat": -6.220397, "lng": 106.635553},
    { "name": "GT TANGERANG 1", "lat": -6.222354, "lng": 106.639507},
    { "name": "GT KUNCIRAN 5", "lat": -6.218287, "lng": 106.662515},
    { "name": "GT KUNCIRAN 4", "lat": -6.220116, "lng": 106.668674},
    { "name": "GT KUNCIRAN 3", "lat": -6.219899, "lng": 106.669179},
    { "name": "GT KUNCIRAN 7", "lat": -6.215605, "lng": 106.665351},
    { "name": "GT KUNCIRAN 2 (GTO)", "lat": -6.217365, "lng": 106.668027},
    { "name": "GT KUNCIRAN 2", "lat": -6.217126, "lng": 106.668590},
    { "name": "GT KUNCIRAN 6", "lat": -6.216553, "lng": 106.668182},
    { "name": "GT KARANG TENGAH BARAT 2_1", "lat": -6.203733, "lng": 106.703286},
    { "name": "GT KARANG TENGAH BARAT 1_1", "lat": -6.204705, "lng": 106.703113},
    { "name": "GT KARANG TENGAH BARAT 2_2", "lat": -6.202096, "lng": 106.705714},
    { "name": "GT KARANG TENGAH BARAT 2_3", "lat": -6.201937, "lng": 106.706591},
    { "name": "GT KARANG TENGAH BARAT 1_2", "lat": -6.196378, "lng": 106.713909},
    { "name": "GT KEMBANGAN SELATAN", "lat": -6.189957, "lng": 106.730255},
    { "name": "GT MERUYA UTARA 1", "lat": -6.191354, "lng": 106.735989},
    { "name": "GT MERUYA 1", "lat": -6.191718, "lng": 106.744756},
    { "name": "GT MERUYA 1 SATELIT", "lat": -6.191677, "lng": 106.744231},
    { "name": "GT MERUYA 2", "lat": -6.191198, "lng": 106.744196},
    { "name": "GT KEBON JERUK 1", "lat": -6.190268, "lng": 106.767967},
    { "name": "GT KEBON JERUK 2", "lat": -6.189724, "lng": 106.767980},
    { "name": "GT BITUNG 1", "lat": -6.218644, "lng": 106.565409},
    { "name": "GT BITUNG 2", "lat": -6.219277, "lng": 106.566233},
    { "name": "GT MERUYA UTARA 4", "lat": -6.194029, "lng": 106.731418},
    { "name": "GT MERUYA UTARA 2", "lat": -6.192035, "lng": 106.733459},
    { "name": "GT MERUYA UTAMA 3", "lat": -6.193170, "lng": 106.732740},
    { "name": "GT MERUYA UTARA 3", "lat": -6.192874, "lng": 106.733228},
    { "name": "GT MERUYA UTAMA 2", "lat": -6.194867, "lng": 106.733171},
    { "name": "GT BOGOR 1", "lat": -6.597455, "lng": 106.817616},
    { "name": "GT CIAWI 1", "lat": -6.631129, "lng": 106.838987},
    { "name": "GT SENTUL SELATAN 2", "lat": -6.562483, "lng": 106.842737},
    { "name": "GT SENTUL SELATAN 1", "lat": -6.563932, "lng": 106.844929},
    { "name": "GT CIBUBUR 3", "lat": -6.373200, "lng": 106.896243},
    { "name": "GT CIBUBUR 1", "lat": -6.365806, "lng": 106.895015},
    { "name": "GT CIBUBUR 2", "lat": -6.365289, "lng": 106.894234},
    { "name": "GT CIMANGGIS 2", "lat": -6.382810, "lng": 106.895695},
    { "name": "GT CIMANGGIS 4", "lat": -6.385150, "lng": 106.895552},
    { "name": "GT CIMANGGIS 3", "lat": -6.386769, "lng": 106.896584},
    { "name": "GT CIMANGGIS 5", "lat": -6.387726, "lng": 106.898139},
    { "name": "GT CIMANGGIS 1", "lat": -6.390653, "lng": 106.895260},
    { "name": "GT TAMAN MINI 1", "lat": -6.287112, "lng": 106.878240},
    { "name": "GT TAMAN MINI 2", "lat": -6.287372, "lng": 106.877623},
    { "name": "GT DUKUH 1", "lat": -6.301691, "lng": 106.883554},
    { "name": "GT DUKUH 3", "lat": -6.299842, "lng": 106.883171},
    { "name": "GT UTAMA PASAR REBO", "lat": -6.310145, "lng": 106.884777},
    { "name": "GT DUKUH 2", "lat": -6.303403, "lng": 106.883272},
    { "name": "GT CIMANGGIS OFF RAMP", "lat": -6.421117, "lng": 106.893741},
    { "name": "GT CIMANGGIS ON RAMP", "lat": -6.421041, "lng": 106.893659},
    { "name": "GT GUNUNG PUTRI ON RAMP", "lat": -6.461260, "lng": 106.889341},
    { "name": "GT GUNUNG PUTRI OFF RAMP", "lat": -6.461449, "lng": 106.889174},
    { "name": "GT KARANGGAN OFF RAMP", "lat": -6.457235, "lng": 106.884046},
    { "name": "GT KARANGGAN ON RAMP", "lat": -6.457187, "lng": 106.884020},
    { "name": "GT CITEUREUP 1", "lat": -6.482461, "lng": 106.874452},
    { "name": "GT CITEUREUP 2", "lat": -6.483423, "lng": 106.873153},
    { "name": "GT SENTUL 1", "lat": -6.528124, "lng": 106.854283},
    { "name": "GT SENTUL 2", "lat": -6.531445, "lng": 106.852579},
    { "name": "GT CIAWI 2", "lat": -6.602257, "lng": 106.831286},
    { "name": "GT BOGOR SELATAN", "lat": -6.613720, "lng": 106.832399},
    { "name": "GT BOGOR 2", "lat": -6.595940, "lng": 106.826462},
    { "name": "GT SENTUL 4", "lat": -6.533506, "lng": 106.851930},
    { "name": "GT SENTUL 3", "lat": -6.533921, "lng": 106.852434},
    { "name": "GT CITEUREUP 3", "lat": -6.486759, "lng": 106.872361},
    { "name": "GT CITEUREUP 4", "lat": -6.486091, "lng": 106.871878},
    { "name": "GT PONDOK KELAPA 2", "lat": -6.248467, "lng": 106.926014},
    { "name": "GT PONDOK KELAPA", "lat": -6.248652, "lng": 106.933012},
    { "name": "GT BINTARA JAYA", "lat": -6.249689, "lng": 106.950174},
    { "name": "GT JAKASAMPURNA", "lat": -6.249732, "lng": 106.963561},
    { "name": "UNKNOWN_564", "lat": -6.247732, "lng": 106.998089},
    { "name": "GT SEMPER 1", "lat": -6.139364, "lng": 106.937935},
    { "name": "GT SEMPER 2", "lat": -6.117956, "lng": 106.925551},
    { "name": "GT KOJA TIMUR", "lat": -6.108374, "lng": 106.912484},
    { "name": "GT KOJA BARAT", "lat": -6.108478, "lng": 106.902479},
    { "name": "GT KOJA DIRECT", "lat": -6.104092, "lng": 106.900019},
    { "name": "GT ROROTAN 1", "lat": -6.146100, "lng": 106.940256},
    { "name": "GT KEBON BAWANG", "lat": -6.119546, "lng": 106.893252},
    { "name": "GT LUBUK PAKAM", "lat": 3.538212, "lng": 98.892527},
    { "name": "GT PERBAUNGAN", "lat": 3.548790, "lng": 99.009824},
    { "name": "GT TELUK MENGKUDU", "lat": 3.516178, "lng": 99.095313},
    { "name": "GT SEI RAMPAH", "lat": 3.457404, "lng": 99.140041},
    { "name": "GT PARBARAKAN_2", "lat": 3.386364, "lng": 99.160754},
    { "name": "GT KEMIRI", "lat": 3.557826, "lng": 98.853297},
    { "name": "GT KUALANAMU", "lat": 3.588764, "lng": 98.844832},
    { "name": "GT HALIM 2", "lat": -6.246384, "lng": 106.887378},
    { "name": "GT HALIM", "lat": -6.245433, "lng": 106.888379},
    { "name": "GT HALIM UTAMA", "lat": -6.245186, "lng": 106.889025},
    { "name": "GT PONDOK GEDE BARAT 2", "lat": -6.256353, "lng": 106.908140},
    { "name": "GT PONDOK GEDE BARAT", "lat": -6.255569, "lng": 106.907788},
    { "name": "GT PONDOK GEDE TIMUR 1", "lat": -6.256825, "lng": 106.943274},
    { "name": "GT PONDOK GEDE TIMUR 2", "lat": -6.257541, "lng": 106.945396},
    { "name": "GT CIKUNIR 4", "lat": -6.256414, "lng": 106.954690},
    { "name": "GT CIKUNIR 3", "lat": -6.256871, "lng": 106.954714},
    { "name": "GT CIKUNIR 2", "lat": -6.256786, "lng": 106.960125},
    { "name": "GT BEKASI BARAT 2", "lat": -6.252506, "lng": 106.987963},
    { "name": "GT BEKASI BARAT", "lat": -6.250715, "lng": 106.987056},
    { "name": "GT BEKASI BARAT 1", "lat": -6.249773, "lng": 106.990341},
    { "name": "GT BEKASI TIMUR 2", "lat": -6.263468, "lng": 107.015874},
    { "name": "GT BEKASI TIMUR 1", "lat": -6.261528, "lng": 107.016890},
    { "name": "GT TAMBUN", "lat": -6.278474, "lng": 107.051667},
    { "name": "GT CIBITUNG 2", "lat": -6.288025, "lng": 107.081772},
    { "name": "GT CIBITUNG", "lat": -6.289222, "lng": 107.081122},
    { "name": "GT CIBITUNG 1", "lat": -6.282415, "lng": 107.085077},
    { "name": "GT CIKARANG UTARA", "lat": -6.299290, "lng": 107.124492},
    { "name": "GT CIKARANG UTAMA", "lat": -6.303180, "lng": 107.120942},
    { "name": "GT CIKARANG BARAT", "lat": -6.311428, "lng": 107.140019},
    { "name": "GT CIKARANG BARAT 2", "lat": -6.311865, "lng": 107.136806},
    { "name": "GT CIKARANG BARAT 1", "lat": -6.312766, "lng": 107.137165},
    { "name": "GT CIKARANG BARAT 5", "lat": -6.313482, "lng": 107.135820},
    { "name": "GT CIKARANG BARAT 3", "lat": -6.311960, "lng": 107.136024},
    { "name": "GT CIBATU", "lat": -6.332237, "lng": 107.162241},
    { "name": "GT CIKARANG TIMUR", "lat": -6.341828, "lng": 107.185570},
    { "name": "GT KARAWANG BARAT", "lat": -6.345904, "lng": 107.269529},
    { "name": "GT KARAWANG BARAT 1", "lat": -6.351913, "lng": 107.266814},
    { "name": "GT KARAWANG BARAT 2", "lat": -6.352782, "lng": 107.266594},
    { "name": "GT KARAWANG TIMUR 1", "lat": -6.352937, "lng": 107.336155},
    { "name": "GT KARAWANG TIMUR 2", "lat": -6.359221, "lng": 107.331847},
    { "name": "GT KALIHURIP UTAMA 4", "lat": -6.425552, "lng": 107.424329},
    { "name": "GT KALIHURIP 4", "lat": -6.424990, "lng": 107.424410},
    { "name": "GT KALIHURIP 2", "lat": -6.426190, "lng": 107.429341},
    { "name": "GT KALIHURIP 1", "lat": -6.423543, "lng": 107.430397},
    { "name": "GT KALIHURIP 3", "lat": -6.424149, "lng": 107.427286},
    { "name": "GT NUSA DUA", "lat": -8.778222, "lng": 115.208560},
    { "name": "GT NGURAH RAI", "lat": -8.744190, "lng": 115.188181},
    { "name": "GT BENOA", "lat": -8.735201, "lng": 115.207975},
    { "name": "GT KALIWUNGU", "lat": -6.970612, "lng": 110.282728},
    { "name": "GT KALIANGKUNG", "lat": -6.987575, "lng": 110.316970},
    { "name": "GT WELERI", "lat": -6.973685, "lng": 110.058560},
    { "name": "GT KENDAL", "lat": -6.985928, "lng": 110.152887},
    { "name": "GT KANDEMAN", "lat": -6.932583, "lng": 109.759997},
    { "name": "GT PADANG TIJI", "lat": 5.366374, "lng": 95.849288},
    { "name": "GT SEULIMEUM", "lat": 5.361353, "lng": 95.641714},
    { "name": "GT KUTA BARO", "lat": 5.568197, "lng": 95.411808},
    { "name": "GT BAITUSSALAM", "lat": 5.586835, "lng": 95.405579},
    { "name": "GT INDRAPURI", "lat": 5.401619, "lng": 95.459779},
    { "name": "GT JANTHO", "lat": 5.324023, "lng": 95.586209},
    { "name": "GT BLANG BINTANG", "lat": 5.508086, "lng": 95.446435},
    { "name": "GT BANDAR", "lat": -7.579514, "lng": 112.137754},
    { "name": "GT MOJOKERTO BARAT", "lat": -7.451599, "lng": 112.406274},
    { "name": "GT JOMBANG", "lat": -7.493102, "lng": 112.239173},
    { "name": "GT BREBES TIMUR", "lat": -6.898379, "lng": 109.067494},
    { "name": "GT BREBES BARAT", "lat": -6.899252, "lng": 109.015130},
    { "name": "GT TEGAL", "lat": -6.938535, "lng": 109.149367},
    { "name": "GT PONDOK RANJI", "lat": -6.283549, "lng": 106.734741},
    { "name": "GT PONDOK RANJI SAYAP", "lat": -6.282589, "lng": 106.736103},
    { "name": "GT WARU 3", "lat": -7.347137, "lng": 112.711187},
    { "name": "GT JORR", "lat": -6.264639, "lng": 106.768007},
    { "name": "GT SBY SURAMADU", "lat": -7.211930, "lng": 112.778362},
    { "name": "GT SURAMADU 5151 MADURA", "lat": -7.157311, "lng": 112.782181},
    { "name": "GT MARGOMULYO", "lat": -7.238661, "lng": 112.678826},
    { "name": "GT JATIWARNA 2", "lat": -6.311429, "lng": 106.921655},
    { "name": "GT CIKAMPEK", "lat": -6.440027, "lng": 107.476810},
    { "name": "GT CIKOPO", "lat": -6.458229, "lng": 107.509226},
    { "name": "GT PEJAGAN", "lat": -6.895679, "lng": 108.882297},
    { "name": "GT RAMP TALLO BARAT", "lat": -5.111243, "lng": 119.439356},
    { "name": "GT JOGLO 1", "lat": -6.221214, "lng": 106.747200},
    { "name": "GT KEJAPANAN 2", "lat": -7.552426, "lng": 112.691107},
    { "name": "GT WILANGAN", "lat": -7.553307, "lng": 111.765972},
    { "name": "GT CILEDUG", "lat": -6.888258, "lng": 108.748972},
    { "name": "GT MARELAN 2", "lat": 3.648777, "lng": 98.656037},
    { "name": "GT MARELAN 1", "lat": 3.649242, "lng": 98.656215},
    { "name": "GT CARINGIN", "lat": -6.701226, "lng": 106.824640},
    { "name": "GT AIR MADIDI", "lat": 1.409783, "lng": 124.981891},
    { "name": "GT SAMBOJA", "lat": -0.995190, "lng": 116.986618}
]

export interface RouteResponse {
  coordinates: { lat: number; lng: number }[]
  distance: number // in kilometers
  duration: number // in minutes
  segments: RouteSegment[]
}

// FIXED: Enhanced OSRM route calculation dengan better error handling
const getRouteFromOSRM = async (startPoint: Location, endPoint: Location): Promise<{
  coordinates: { lat: number; lng: number }[]
  distance: number
  duration: number
}> => {
  try {
    console.log(`🛣️ Frontend: Getting OSRM route from ${startPoint.name} to ${endPoint.name}`)
    
    // Validate coordinates
    if (!isValidCoordinate(startPoint.lat, startPoint.lng) || 
        !isValidCoordinate(endPoint.lat, endPoint.lng)) {
      console.warn('Frontend: Invalid coordinates, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    // Format coordinates for OSRM (lng,lat)
    const coordinates = `${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}`
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`
    
    console.log(`📡 Frontend OSRM API URL: ${url}`)
    
    // FIXED: Better fetch with timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'TJA-Tracking-System/1.0'
      }
    }).finally(() => clearTimeout(timeoutId))
    
    if (!response.ok) {
      console.warn(`Frontend OSRM API failed (${response.status}), falling back to direct route`)
      return getDirectRoute(startPoint, endPoint)
    }
    
    const data = await response.json()
    
    if (!data.routes || data.routes.length === 0) {
      console.warn('Frontend: No routes found from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    const route = data.routes[0]
    const geometry = route.geometry
    
    // Validate geometry
    if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates)) {
      console.warn('Frontend: Invalid geometry from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    // Convert GeoJSON coordinates to our format
    const routeCoordinates = geometry.coordinates
      .filter((coord: number[]) => Array.isArray(coord) && coord.length >= 2)
      .map((coord: number[]) => ({
        lat: coord[1], // GeoJSON uses [lng, lat]
        lng: coord[0]
      }))
      .filter((coord: {lat: number, lng: number}) => isValidCoordinate(coord.lat, coord.lng))
    
    if (routeCoordinates.length === 0) {
      console.warn('Frontend: No valid coordinates from OSRM, falling back to direct route')
      return getDirectRoute(startPoint, endPoint)
    }
    
    const distanceKm = route.distance / 1000 // Convert meters to kilometers
    const durationMin = route.duration / 60   // Convert seconds to minutes
    
    console.log(`✅ Frontend OSRM route: ${distanceKm.toFixed(1)}km, ${durationMin.toFixed(0)} minutes, ${routeCoordinates.length} points`)
    
    return {
      coordinates: routeCoordinates,
      distance: distanceKm,
      duration: durationMin
    }
    
  } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Frontend: OSRM API timeout, falling back to direct route');
      } else {
          console.warn('Frontend: Error calling OSRM API:', error);
      }
      console.log('Frontend: Falling back to direct route calculation');
      return getDirectRoute(startPoint, endPoint);
  }
}

// Enhanced fallback direct route calculation
const getDirectRoute = (startPoint: Location, endPoint: Location): {
  coordinates: { lat: number; lng: number }[]
  distance: number
  duration: number
} => {
  const directDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng)
  const directDuration = (directDistance / 50) * 60 // Assume 50 km/h average
  
  // Generate smooth curve points for better animation
  const coordinates = []
  const numPoints = Math.max(20, Math.min(100, Math.floor(directDistance * 3))) // More points for smoother animation
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints
    
    // Add slight curve to make it look less robotic
    const curveFactor = 0.0001 // Small curve
    const curve = Math.sin(ratio * Math.PI) * curveFactor
    
    coordinates.push({
      lat: startPoint.lat + (endPoint.lat - startPoint.lat) * ratio + curve,
      lng: startPoint.lng + (endPoint.lng - startPoint.lng) * ratio,
    })
  }
  
  console.log(`📍 Frontend direct route fallback: ${directDistance.toFixed(1)}km, ${directDuration.toFixed(0)} minutes`)
  
  return {
    coordinates,
    distance: directDistance,
    duration: directDuration
  }
}

// ENHANCED: Route calculation dengan support untuk partial routes dan better error handling
export const calculateRouteFromSegments = async (segments: RouteSegment[]): Promise<RouteResponse> => {
  try {
    console.log('🛣️ Frontend: Calculating route from', segments.length, 'segments with REAL road data')
    
    if (!segments || segments.length === 0) {
      throw new Error("No segments provided for route calculation")
    }

    if (segments.length === 1) {
      // Single segment - create a small loop for preview
      const segment = segments[0]
      const coordinates = [
        segment.location,
        {
          lat: segment.location.lat + 0.001,
          lng: segment.location.lng + 0.001
        },
        segment.location
      ]
      
      return {
        coordinates,
        distance: 0.1,
        duration: 1,
        segments: segments
      }
    }

    let totalDistance = 0
    let totalDuration = 0
    const allCoordinates: { lat: number; lng: number }[] = []
    
    // Sort segments by order
    const sortedSegments = [...segments].sort((a, b) => a.order - b.order)
    
    // FIXED: Better segment validation
    const validSegments = sortedSegments.filter(segment => {
      const isValid = segment && 
                     segment.location && 
                     typeof segment.location.lat === 'number' && 
                     typeof segment.location.lng === 'number' &&
                     isValidCoordinate(segment.location.lat, segment.location.lng)
      
      if (!isValid) {
        console.warn('Frontend: Filtering out invalid segment:', segment)
      }
      
      return isValid
    })
    
    if (validSegments.length < 2) {
      throw new Error("Need at least 2 valid segments to calculate route")
    }
    
    // ENHANCED: Process each segment pair dengan better error handling
    for (let i = 0; i < validSegments.length - 1; i++) {
      const currentSegment = validSegments[i]
      const nextSegment = validSegments[i + 1]
      
      let startPoint: Location
      let endPoint: Location
      let segmentType = 'direct'
      
      // Determine start point
      if (currentSegment.type === 'toll_entry' && currentSegment.toll_entry_gate) {
        startPoint = {
          name: currentSegment.toll_entry_gate.name,
          lat: currentSegment.toll_entry_gate.lat,
          lng: currentSegment.toll_entry_gate.lng
        }
      } else {
        startPoint = currentSegment.location
      }
      
      // Determine end point and segment type
      if (nextSegment.type === 'toll_entry' && nextSegment.toll_entry_gate) {
        endPoint = {
          name: nextSegment.toll_entry_gate.name,
          lat: nextSegment.toll_entry_gate.lat,
          lng: nextSegment.toll_entry_gate.lng
        }
      } else if (nextSegment.type === 'toll_exit' && nextSegment.toll_exit_gate) {
        endPoint = {
          name: nextSegment.toll_exit_gate.name,
          lat: nextSegment.toll_exit_gate.lat,
          lng: nextSegment.toll_exit_gate.lng
        }
        segmentType = 'toll' // This is a toll segment
      } else {
        endPoint = nextSegment.location
      }
      
      // Skip if start and end points are too close (same location)
      const segmentDistance = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng)
      if (segmentDistance < 0.01) {
        console.log(`⚠️ Frontend: Skipping segment ${i + 1} (distance too small: ${segmentDistance.toFixed(3)}km)`)
        continue
      }
      
      // ENHANCED: Get real route with better error handling
      console.log(`🚗 Frontend: Getting REAL route: ${startPoint.name} → ${endPoint.name} (${segmentType})`)
      
      let routeData
      try {
        routeData = await getRouteFromOSRM(startPoint, endPoint)
      } catch (error) {
        console.warn(`Frontend: Route calculation failed for ${startPoint.name} → ${endPoint.name}:`, error)
        routeData = getDirectRoute(startPoint, endPoint)
      }
      
      if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) {
        console.warn(`Frontend: No route data for segment ${i + 1}, using direct route`)
        routeData = getDirectRoute(startPoint, endPoint)
      }
      
      // Add calculated segment to totals
      totalDistance += routeData.distance
      totalDuration += routeData.duration
      
      // Add stop duration if this is a stop
      if (currentSegment.type === 'stop' && currentSegment.stop_duration) {
        totalDuration += currentSegment.stop_duration
        console.log(`⏱️ Frontend: Added ${currentSegment.stop_duration} minutes stop time at ${currentSegment.location.name}`)
      }
      
      // Add coordinates from this segment (avoid duplication)
      if (i === 0) {
        allCoordinates.push(...routeData.coordinates)
      } else {
        // Skip first point to avoid duplication, but ensure continuity
        const lastCoord = allCoordinates[allCoordinates.length - 1]
        const firstNewCoord = routeData.coordinates[0]
        
        // Check if there's a gap between segments
        if (lastCoord && firstNewCoord) {
          const gap = calculateDistance(lastCoord.lat, lastCoord.lng, firstNewCoord.lat, firstNewCoord.lng)
          if (gap > 0.1) { // If gap > 100m, add connecting line
            console.log(`🔗 Frontend: Adding connection between segments (gap: ${gap.toFixed(2)}km)`)
            allCoordinates.push(firstNewCoord)
          }
        }
        
        allCoordinates.push(...routeData.coordinates.slice(1)) // Skip first point to avoid duplication
      }
      
      console.log(`📍 Frontend Segment ${i + 1}: ${startPoint.name} → ${endPoint.name} (${routeData.distance.toFixed(1)}km, ${routeData.duration.toFixed(0)}min, ${segmentType}, ${routeData.coordinates.length} points)`)
    }
    
    // Ensure we have some coordinates
    if (allCoordinates.length === 0) {
      console.log('🔄 Frontend: No coordinates found, creating fallback')
      
      // Use first and last segment locations for fallback
      const firstSegment = validSegments[0]
      const lastSegment = validSegments[validSegments.length - 1]
      
      if (firstSegment && lastSegment) {
        const fallbackRoute = await getRouteFromOSRM(firstSegment.location, lastSegment.location)
        allCoordinates.push(...fallbackRoute.coordinates)
        totalDistance = fallbackRoute.distance
        totalDuration = fallbackRoute.duration
      }
    }
    
    // Ensure minimum values
    totalDistance = Math.max(0.1, totalDistance)
    totalDuration = Math.max(1, totalDuration)
    
    console.log(`🏁 Frontend Complete route: ${totalDistance.toFixed(1)}km, ${Math.round(totalDuration)} minutes, ${allCoordinates.length} coordinate points following REAL roads`)
    
    return {
      coordinates: allCoordinates,
      distance: totalDistance,
      duration: Math.round(totalDuration),
      segments: segments
    }
    
  } catch (error) {
    console.error('Frontend: Error calculating route from segments:', error)
    
    // ENHANCED: Better emergency fallback
    if (segments.length >= 2) {
      const validSegments = segments.filter(segment => 
        segment && segment.location && 
        isValidCoordinate(segment.location.lat, segment.location.lng)
      )
      
      if (validSegments.length >= 2) {
        const firstSegment = validSegments[0]
        const lastSegment = validSegments[validSegments.length - 1]
        
        console.log('🚨 Frontend: Using enhanced emergency fallback route')
        
        try {
          const emergencyRoute = await getRouteFromOSRM(firstSegment.location, lastSegment.location)
          return {
            coordinates: emergencyRoute.coordinates,
            distance: emergencyRoute.distance,
            duration: Math.round(emergencyRoute.duration),
            segments: segments
          }
        } catch (emergencyError) {
          console.error('Frontend: Emergency fallback also failed:', emergencyError)
          
          // Ultimate fallback - direct line
          const directRoute = getDirectRoute(firstSegment.location, lastSegment.location)
          return {
            coordinates: directRoute.coordinates,
            distance: directRoute.distance,
            duration: Math.round(directRoute.duration),
            segments: segments
          }
        }
      }
    }
    
    throw new Error('Unable to calculate any route from the provided segments')
  }
}

// Enhanced coordinate validation
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return typeof lat === 'number' && typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) && 
         isFinite(lat) && isFinite(lng) &&
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180 &&
         (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001) // Exclude null island and very close to 0,0
}

// Find nearest toll gates with better filtering
export const findNearestTollGates = (location: Location, limit: number = 5): TollGate[] => {
  if (!location || !isValidCoordinate(location.lat, location.lng)) {
    return []
  }

  return TOLL_GATES
    .map(gate => ({
      ...gate,
      distance: calculateDistance(location.lat, location.lng, gate.lat, gate.lng)
    }))
    .filter(gate => gate.distance <= 200) // Only gates within 200km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ distance, ...gate }) => gate)
}

// Enhanced distance calculation with validation
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // Validate inputs
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    console.warn('Invalid coordinates for distance calculation:', lat1, lng1, lat2, lng2)
    return 0
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return isNaN(distance) ? 0 : distance
}

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

// Legacy function for backward compatibility
export const calculateRoute = async (
  departure: Location,
  stops: Location[],
  destination: Location,
): Promise<RouteResponse> => {
  // Convert to segments format
  const segments: RouteSegment[] = [
    {
      id: '1',
      type: 'departure',
      location: departure,
      order: 1
    }
  ]
  
  // Add stops
  stops.forEach((stop, index) => {
    segments.push({
      id: `stop-${index + 1}`,
      type: 'stop',
      location: stop,
      stop_duration: 30, // Default 30 minutes
      order: index + 2
    })
  })
  
  // Add destination
  segments.push({
    id: 'destination',
    type: 'destination',
    location: destination,
    order: segments.length + 1
  })
  
  return calculateRouteFromSegments(segments)
}