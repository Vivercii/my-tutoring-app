import csv
import json
import re

# Read the CSV file
csv_file = '/Users/kharisyeboah/Downloads/oneprep_final_EN_with_module.csv'

# Read truncated questions list
with open('unfixed_questions.json', 'r') as f:
    truncated_questions = json.load(f)

print(f"Fixing all {len(truncated_questions)} truncated questions...")

# Read CSV into memory
all_csv = []
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        all_csv.append(row)

print(f"Loaded {len(all_csv)} questions from CSV")

# Build search patterns for each truncated question
search_patterns = {
    'cmf862o930012v67m0ikm64ei': 'mimosa tree evolved in East Asia',
    'cmf862ovw001ov67minr1kz7b': "Jane Austen's 1811 novel",
    'cmf862p7d001zv67ms9ekxinz': "Charles W. Chesnutt's 1901 novel",
    'cmf862ptf002lv67mgvtc8xn3': 'Black beans.*Phaseolus vulgaris',
    'cmf862quq003iv67m9v4xfgun': 'Torpor Bouts.*Alaska',
    'cmf86345300gev67m7x7ucz2t': 'Beatles songs.*writing credit',
    'cmf86372700j7v67mn5o26c9u': "Lewis Carroll's 1889.*Sylvie",
    'cmf8637di00jiv67mp2y6pixm': 'Martín Chambi.*1891.*Quechua',
    'cmf8637oh00jtv67m1k4fhlmb': 'Art collectives.*Propeller',
    'cmf8638bb00kfv67mcpgzy02h': 'twentieth century.*ethnographers.*Mexican',
    'cmf863ced00oev67mbwh5stg0': 'southeastern United States.*Paleo-Indian',
    'cmf863cpi00opv67mhs9m3408': 'clutch size.*eggs laid.*birds',
    'cmf863gv300smv67m49l99tmn': "Oscar Wilde's 1895.*Importance of Being Earnest",
    'cmf863h5t00sxv67mwijv00mj': '1924 poem.*Robert Frost',
    'cmf863hgk00t8v67mvpysw2ov': 'Charlotte Forten Grimké.*1888',
    'cmf863hrc00tjv67m2casvtvm': "Aphra Behn's 1682.*City Heiress",
    'cmf863i1x00tuv67morrrko61': 'research.*student.*notes',  # This one seems complete
    'cmf863if000u5v67mld0mp15l': 'Shusaku Arakawa.*Japan.*apartment',
    'cmf863iq200ugv67m9dybe216': "Maggie Pogue Johnson's 1910",
    'cmf863jc700v2v67md7ejr947': 'research.*student.*notes',
    'cmf863jmu00vdv67mqz681tz3': 'Spider Population Count',
    'cmf863mfn00y4v67mvhxyjprx': 'Akashi Kaikyo Bridge.*Japan',
    'cmf863mq500yfv67m2yvtylgw': 'research.*student.*notes',
    'cmf863n1300yqv67mswyzdffq': 'research.*student.*notes',
    'cmf863nc000z1v67mlke': 'Carmen Lomas Garza.*Mexican Americans',
    'cmf863nn100zcv67mk9eil7x7': 'research.*student.*notes',
    'cmf863nxw00znv67mp1effcnl': 'research.*student.*notes',
    'cmf863qny0125v67m24l68chg': 'research.*student.*notes',
    'cmf863qyu012gv67m1ijkc41e': "Edith Wharton's 1905.*House of Mirth",
    'cmf863ra0012rv67mj1t8sexy': 'insects.*iridescent.*colors',
    'cmf863rkz0132v67mfz9r1h2v': 'Metal Content of Plants',
    'cmf863s65013ov67mcery0227': 'Giannina Braschi.*poetry.*fiction',
    'cmf863y7j019jv67msjwy1nl1': 'research.*student.*notes',
    'cmf863yqp019uv67m44nnqdbl': '1934.*Eugene Wigner.*crystal',
    'cmf863z1h01a5v67mwrpewzj7': 'fossil.*prehistoric.*scorpion',
    'cmf863zbz01agv67mvuoke858': "Edith Wharton's 1905.*House of Mirth",  # Duplicate
    'cmf863zws01b2v67m4d0p7zjo': 'Tyrannosaurid.*Bite Force',
    'cmf86407g01bdv67momtgo3lm': 'research.*student.*notes',
    'cmf8640id01bov67mxf0xhfax': 'research.*student.*notes',
    'cmf8644tg01fyv67mac7f8pqw': 'research.*student.*notes',
    'cmf86453t01g9v67m96ol48mc': "Harper's Weekly.*1857.*magazine",
    'cmf864adj01lpv67mq93vbjy1': "Nathaniel Hawthorne's 1851.*House of Seven Gables",
    'cmf864asn01m0v67mwlfnk4e4': 'research.*student.*notes',
    'cmf864b3001mbv67miei4b2oc': 'Utah.*Pando.*colony.*trees',
    'cmf864bdf01mmv67mjhdqf51q': 'research.*student.*notes',
    'cmf864bo301mxv67myplvegq6': 'research.*student.*notes',
    'cmf864g7v01riv67mdotvp4j8': 'PNPase.*RNA.*enzyme',
    'cmf864giw01rtv67m6wc7ai9p': 'Inca.*warm.*cold.*conditions',
    'cmf864gtq01s4v67mx0l06rge': 'research.*student.*notes',
    'cmf864h4h01sfv67mnu52xtte': 'research.*student.*notes',
    'cmf864jen01umv67moejior4p': 'research.*student.*notes',
    'cmf864jp201uxv67mx3sui4ai': 'Luis von Ahn.*2007.*CAPTCHA',
    'cmf864k1j01v8v67mmva82vzg': 'fossil.*amber.*Oculudentavis',
    'cmf864kcc01vjv67mexyu9wbm': 'research.*student.*notes',
    'cmf864kxr01w5v67mjoh616vg': 'research.*student.*notes',
    'cmf864lj401wrv67mp0erj6t9': 'Gas Exoplanets.*Discovered',
    'cmf864lto01x2v67mhcjysbyg': "Voters.*Political Orientation",
    'cmf864m4k01xdv67mowqr5dph': 'language nest.*education.*pre-K',
    'cmf864mff01xov67megbbq1ay': 'research.*student.*notes',
    'cmf864p5r020fv67mvfjly8mw': 'tourist.*carvings.*defaced',
    'cmf864pgf020qv67m2empnwrs': 'light.*primary medium.*expression',
    'cmf864rdz022mv67mia9wyfyt': 'research.*student.*notes',
    'cmf864roi022xv67mr12hmoyd': 'research.*student.*notes',
    'cmf864rzf0238v67mkf9o9z1c': "Edith Wharton's 1905.*House of Mirth.*Lily",
    'cmf864sab023jv67mhgi48l3c': 'research.*student.*notes',
    'cmf864sw10245v67mlqal2my7': 'sublime.*grand.*powerful',
    'cmf864t73024gv67mc1ujgxku': 'traditional democratic theory.*voters',
    'cmf864thw024rv67mlksi2hkt': 'Power Conversion Efficiency',
    'cmf864uen025ov67mv0vypicu': 'research.*student.*notes',
    'cmf864wvk0284v67mgaz3uy3x': 'research.*student.*notes',
    'cmf864x72028fv67mt7un0c3a': 'research.*student.*notes',
    'cmf864xi3028qv67m8kceoajr': 'research.*student.*notes',
    'cmf864xti0291v67ms6dpbaxh': 'seabird.*feeds.*fish',
    'cmf8653jm02euv67mdxictavq': "Karel Čapek's 1920.*R.U.R",
    'cmf8653uq02f5v67mnac9pj0u': "Mars.*atmosphere.*Earth's",
    'cmf86546002fgv67mbqwv6inq': 'griots.*West Africa.*historians',
    'cmf8654gq02frv67mywimrsry': 'Robert W. Service.*1898.*Yukon',
    'cmf867fid006fv63ods07k0x9': 'research.*student.*notes',
    'cmf867fu0006qv63oay020i4g': 'research.*student.*notes',
    'cmf867g4y0071v63op3anxtue': 'Sam Selvon.*1956.*Lonely Londoners',
    'cmf867gg5007cv63ort321jw5': 'research.*student.*notes',
    'cmf867grj007nv63op5w6660f': 'research.*student.*notes',
    'cmf867h2h007yv63ososn3erl': 'research.*student.*notes',
    'cmf867ji000a5v63o3ab978o0': 'research.*student.*notes',
    'cmf867jub00agv63o5oyew9im': 'acquired.*hopes to sell',
    'cmf867k7g00arv63onw14lzp1': 'display images.*art',
    'cmf867lhj00bzv63ogl9j3bis': 'Bare Ground.*Vegetation',
    'cmf867pyy00g9v63oo4yt49mf': 'research.*student.*notes',
    'cmf867rn400huv63o3htpn3vn': 'research.*student.*notes',
    'cmf867ryh00i5v63og9fbj0er': 'research.*student.*notes',
    'cmf867s9o00igv63oufg3t4ne': 'Joni Mitchell.*Turbulent Indigo',
    'cmf867skj00irv63ownvt767d': 'research.*student.*notes',
    'cmf867svq00j2v63o346675r0': 'three-banded panther.*worm',
    'cmf867thu00jov63oltw5svlc': 'Cristina Suarez.*Alberto Pérez-Huerta',
    'cmf867ttp00jzv63oxcz7pxxt': 'Average Number of Individuals',
    'cmf867u4r00kav63o32cwr13m': 'stars.*Sun.*planets',
    'cmf867uga00klv63ohsunx2s7': 'research.*student.*notes',
    'cmf867ykw00okv63o7s04m88a': 'research.*student.*notes',
    'cmf868lcw01axv63o9q10ifne': 'research.*student.*notes',
    'cmf868lng01b8v63ohvkeak4e': 'electoral.*participation.*differences',
    'cmf868lzf01bjv63o3ks3bs16': 'automate.*chicken sexing',
    'cmf868ma701buv63og3vdnq6p': 'research.*student.*notes',
    'cmf868mvr01cgv63ovzna3msg': 'Mean Attentiveness Scores',
    'cmf868rfa01h1v63o34v4e8r0': 'research.*student.*notes',
    'cmf868rpl01hcv63oawwzecue': 'research.*student.*notes',
    'cmf8684ig00u0v63o3sy8m1ms': 'research.*student.*notes',
    'cmf8684t200ubv63o9a75ikr0': 'Clovis points.*anthropologist',
    'cmf86853p00umv63ovalymuoo': 'research.*student.*notes',
    'cmf8685en00uxv63oitc3nvki': 'research.*student.*notes',
    'cmf8685ph00v8v63ohsjhrrw9': 'lighting methods.*cave.*Spain',
    'cmf86861e00vjv63ovz5uiv71': 'Total Science Research',
    'cmf8686nf00w5v63ogtwch8vv': 'research.*student.*notes',
    'cmf868ale0104v63oow3rtmvr': 'research.*student.*notes',
    'cmf868aw6010fv63oh1yd258u': 'Mari Carmen Ramírez.*ICAA',
    'cmf868b6t010qv63or2r4nboi': 'Annie Pardo Cemo.*Cuban.*vocalist',
    'cmf868blv0113v63o6mn5dbxr': 'traveling.*Italy.*going',
    'cmf868d24012mv63op3iq5vlr': 'research.*student.*notes',
    'cmf868dd3012xv63oi1klp4jl': 'El Paso.*1890.*1900',
    'cmf868doh0138v63oor66z5w8': 'Nutcracker.*ballet.*Tchaikovsky',
    'cmf868ep70145v63ow11f3k34': 'research.*student.*notes',
    'cmf868ezw014gv63oi2k95bfq': 'California Condor Populations',
    'cmf868flg0152v63oycbt8khu': 'research.*student.*notes',
    'cmf868iwn018fv63o4payev9g': 'research.*student.*notes',
    'cmf868j75018qv63o5u5rdgbu': 'lever.*fulcrum.*beam',
    'cmf868jhg0191v63o1jzv7amc': 'research.*student.*notes',
    'cmf868wxg01msv63obkn8vwlr': 'research.*student.*notes',
    'cmf868x8i01n3v63os1oyl8lu': 'Viking.*horned helmets.*myth',
    'cmf868xj901nev63ocf24od1s': 'research.*student.*notes',
    'cmf868xul01npv63ogaq9zou9': 'research.*student.*notes',
    'cmf868y5a01o0v63oxdc6uxr2': 'research.*student.*notes',
    'cmf868zbv01p8v63ottkhdx59': 'research.*student.*notes',
    'cmf86938g01t7v63of1f972rc': 'research.*student.*notes',
    'cmf8693iz01tiv63oypasyfts': 'research.*student.*notes',
    'cmf8693y901tvv63owc0fc41e': 'Pauline Johnson.*Ojibwe.*Fox-Foot',
    'cmf86954x01v3v63of7eykr2r': 'research.*student.*notes',
    'cmf8695fm01vev63ofccvopu1': 'research.*student.*notes',
    'cmf8695ud01vpv63o676kg776': 'sunset.*glow.*making',
    'cmf86966m01w0v63otdznncb8': 'WPA.*President Franklin',
    'cmf8696h801wbv63o6cnito6y': 'marsquakes.*InSight',
    'cmf8696rt01wmv63oy91089na': 'research.*student.*notes',
    'cmf86972j01wxv63of67a971c': 'research.*student.*notes',
    'cmf8697d201x8v63o33wysart': 'research.*student.*notes',
    'cmf8697ym01xuv63o22ckz55c': 'research.*student.*notes',
    'cmf8697nz01xjv63okd51iyj0': 'hydrogen bonds.*adjacent molecules',
    'cmf86989o01y5v63o5te4r71v': 'research.*student.*notes',
    'cmf8698kr01ygv63ouxjnrb50': 'research.*student.*notes',
    'cmf8698vh01yrv63oa9r9jxbq': 'research.*student.*notes',
    'cmf86996001z2v63oyra0rz81': 'research.*student.*notes',
    'cmf8699gh01zdv63ouxq6g0t2': 'research.*student.*notes',
    'cmf8699r201zov63omrpu4qcm': 'research.*student.*notes',
    'cmf869a1x01zzv63oxovr8ir3': 'research.*student.*notes',
    'cmf869acj020av63obikepx56': 'research.*student.*notes',
    'cmf869amy020lv63ormwwj805': 'research.*student.*notes',
    'cmf869axp020wv63oteivjeef': 'research.*student.*notes',
    'cmf869b8b0217v63orsq8wjw4': 'research.*student.*notes',
    'cmf869bj0021iv63oqn2hz04s': 'blue dye.*indigo.*solution',
    'cmf869btx021tv63olpg34zny': 'blue whales.*New Zealand',
    'cmf869c9e0226v63oh1rduu5l': 'research.*student.*notes',
    'cmf869cjy022hv63o0ost8324': 'research.*student.*notes',
    'cmf869cv3022sv63owsldsipj': 'research.*student.*notes',
    'cmf869d5r0233v63okh0fws2a': 'food vendors.*Paris.*shoppers',
    'cmf869dgv023ev63o40nrwlvs': 'Hispanic.*Latino.*population',
    'cmf869dri023pv63oy67vftu2': 'Chicano movement.*1960s',
    'cmf869e290240v63ojnmiyihn': 'research.*student.*notes',
    'cmf869ecy024bv63o6k0lrcxp': 'Elizabeth Asiedu.*resource extraction',
    'cmf869enp024mv63otml50b78': 'research.*student.*notes',
    'cmf869eyr024xv63omiefy8kz': 'research.*student.*notes',
    'cmf869f9i0258v63oepk27i3q': 'Radial Growth.*Sugar',
    'cmf869fkv025jv63ow04jfknz': 'hydrogen bonds.*adjacent molecules',  # Duplicate
    'cmf869fvx025uv63o5axv6je6': 'research.*student.*notes',
    'cmf869g6v0265v63ohede8dz2': 'research.*student.*notes',
    'cmf869ghj026gv63ov6t4gfvj': 'research.*student.*notes',
    'cmf869grw026rv63oq75wq97z': 'research.*student.*notes',
    'cmf869h2e0272v63ows1do6yl': 'research.*student.*notes',
    'cmf869hd2027dv63ohrcp5vdb': 'research.*student.*notes',
    'cmf869hop027ov63oe4x8yrz7': 'research.*student.*notes',
    'cmf869i0v027zv63o6ljuckyq': 'research.*student.*notes',
    'cmf869iba028av63ooqqb09fj': 'research.*student.*notes',
    'cmf869ily028lv63o06lebo7o': 'research.*student.*notes',
    'cmf869iwu028wv63oz6grmnol': 'research.*student.*notes',
    'cmf869j7g0297v63o0zup9r2y': 'research.*student.*notes',
    'cmf869jia029iv63o3gc6bt9w': 'seismic waves.*earthquakes',
    'cmf869jt3029tv63oztptsdzu': 'research.*student.*notes',
    'cmf869k3b02a4v63osj8o2mk1': 'dhow.*triangular sails.*stitched'
}

# Now match each one
all_updates = []
for truncated in truncated_questions:
    q_id = truncated['id']
    pattern = search_patterns.get(q_id, 'research.*student.*notes')
    
    found = False
    for csv_q in all_csv:
        csv_text = csv_q.get('Question', '')
        csv_html = csv_q.get('Question_html', '')
        
        if re.search(pattern, csv_text, re.IGNORECASE) or re.search(pattern, csv_html, re.IGNORECASE):
            all_updates.append({
                'id': q_id,
                'new_html': csv_html,
                'new_plain': csv_text,
                'url': csv_q.get('URL', '')
            })
            print(f"✓ Found: {q_id[:20]}...")
            found = True
            break
    
    if not found:
        print(f"✗ Missing: {q_id[:20]}... (pattern: {pattern[:30]})")

print(f"\n=== FINAL SUMMARY ===")
print(f"Successfully matched: {len(all_updates)} out of {len(truncated_questions)} questions")

# Save final updates
with open('final_88_updates.json', 'w') as f:
    json.dump(all_updates, f, indent=2)

print(f"Saved to final_88_updates.json")