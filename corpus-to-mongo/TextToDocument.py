import json

# replace LEM:maE2 with LEM:maE
# replace EaSaA2 with EaSaA
# replace huwd2 with huwd
# replace Hayov2 with Hayov
# replace <i*aA2 with <i*aA
# replace ja`hiliy~ap2 with ja`hiliy~ap
# replace LEM:EaAd2 with LEM:EaAda
# replace LEM:Sa`liH2 with LEM:Sa`liH
# replace >awofaY`2 with >awofaY`
# replace yugaAvu2 with yugaAvu
# replace EaSof2 with EaSof
# replace >aHoSaY`2 with >aHoSaY`
# replace jawaAb2 with jawaAb
# replace baEol2 with baEol
# replace ma`lik2 with ma`lik
# replace <ilo yaAsiyna


buckwalter = {}
buckwalter['\''] = '\u0621'
buckwalter['>'] = '\u0623'
buckwalter['&'] = '\u0624'
buckwalter['<'] = '\u0625'
buckwalter['}'] = '\u0626'
buckwalter['A'] = '\u0627'
buckwalter['b'] = '\u0628'
buckwalter['p'] = '\u0629'
buckwalter['t'] = '\u062A'
buckwalter['v'] = '\u062B'
buckwalter['j'] = '\u062C'
buckwalter['H'] = '\u062D'
buckwalter['x'] = '\u062E'
buckwalter['d'] = '\u062F'
buckwalter['*'] = '\u0630'
buckwalter['r'] = '\u0631'
buckwalter['z'] = '\u0632'
buckwalter['s'] = '\u0633'
buckwalter['$'] = '\u0634'
buckwalter['S'] = '\u0635'
buckwalter['D'] = '\u0636'
buckwalter['T'] = '\u0637'
buckwalter['Z'] = '\u0638'
buckwalter['E'] = '\u0639'
buckwalter['g'] = '\u063A'
buckwalter['_'] = '\u0640'
buckwalter['f'] = '\u0641'
buckwalter['q'] = '\u0642'
buckwalter['k'] = '\u0643'
buckwalter['l'] = '\u0644'
buckwalter['m'] = '\u0645'
buckwalter['n'] = '\u0646'
buckwalter['h'] = '\u0647'
buckwalter['w'] = '\u0648'
buckwalter['Y'] = '\u0649'
buckwalter['y'] = '\u064A'
buckwalter['F'] = '\u064B'
buckwalter['N'] = '\u064C'
buckwalter['K'] = '\u064D'
buckwalter['a'] = '\u064E'
buckwalter['u'] = '\u064F'
buckwalter['i'] = '\u0650'
buckwalter['~'] = '\u0651'
buckwalter['o'] = '\u0652'
buckwalter['^'] = '\u0653'
buckwalter['#'] = '\u0654'
buckwalter['`'] = '\u0670'
buckwalter['{'] = '\u0671'
buckwalter[':'] = '\u06DC'
buckwalter['@'] = '\u06DF'
buckwalter['"'] = '\u06E0'
buckwalter['['] = '\u06E2'
buckwalter[';'] = '\u06E3'
buckwalter[','] = '\u06E5'
buckwalter['.'] = '\u06E6'
buckwalter['!'] = '\u06E8'
buckwalter['-'] = '\u06EA'
buckwalter['+'] = '\u06EB'
buckwalter['%'] = '\u06EC'
buckwalter[']'] = '\u06ED'
buckwalter[' '] = ' '

def transliterate(word):
    return ''.join([buckwalter[c] for c in word])
    
def getDocument(line):
    parts = line.split("\t")
    doc = {}
    if len(parts) == 4:
        doc["form"] = parts[1]
        doc["form_tr"] = transliterate(parts[1])
        doc["tag"] = parts[2]
        doc = getLocation(parts[0], doc)
        doc = getFeatures(parts[3], doc)
        return doc

def getLocation(part, doc):
    location = {}
    sections = part[1:-1].split(":")
    location["chapter"] = int(sections[0])
    location["verse"] = int(sections[1])
    location["word"] = int(sections[2])
    location["token"] = int(sections[3])
    doc["location"] = location
    return doc
    
def getFeatures(part, doc):
    features = doc
    features["class"] = [];
    pieces = part.split("|")
    for piece in pieces:
        piece = piece.strip()
        if piece == "STEM" or piece == "PREFIX" or piece == "SUFFIX":
            features["type"] = piece
        elif piece.startswith("POS:"):
            features["partOfSpeech"] = piece[4:]
        elif piece.startswith("LEM:"):
            features["lemma"] = piece[4:]
            features["lemma_tr"] = transliterate(piece[4:])
        elif piece.startswith("ROOT:"):
            features["root"] = piece[5:]
            features["root_tr"] = transliterate(piece[5:])
        elif piece == "PERF":
            features["verb_tense"] = "perfect";
        elif piece == "IMPF":
            features["verb_tense"] = "imperfect";
        elif piece == "IMPV":
            features["verb_tense"] = "imperative";
        elif piece == "ACT":
            features["active"] = "true";
        elif piece == "PASS":
            features["active"] = "false"; # passive
        elif piece == "GEN":
            features["tense"] = "genitive";
        elif piece == "DAT":
            features["tense"] = "dative";
        elif piece == "ACC":
            features["tense"] = "accusative";
        elif piece == "NOM":
            features["tense"] = "nominative";
        elif piece[0] == "(" and piece[-1] == ")":
            features["verb_form"] = piece[1:-1];
        elif piece.startswith("MOOD:"):
            features["mood"] = piece[5:];
        elif piece == "INDEF":
            features["definite"] = "false" # default is true?
        elif piece == "SP:kaAn":
            features["class"].append("Kaana") # kaana wa akhawaatuha
        elif piece == "SP:<in~":
            features["class"].append("Inna") # inna wa akhawaatuha
        elif piece == "SP:kaAd":
            features["class"].append("Kaada") # kaada wa akhawaatuha
        elif piece == "PCPL":
            features["class"].append("Participle")
        elif piece == "VN":
            features["class"].append("Verbal Noun")
        elif piece.startswith("PRON:"):
            for token in piece[5:]:
                if token == "1": features["person"] = "first" #first person
                elif token == "2": features["person"] = "second" #second person
                elif token == "3": features["person"] = "third" #third person
                elif token == "M": features["gender"] = "male" #male
                elif token == "F": features["gender"] = "female" #female
                elif token == "S": features["cardinality"] = "singular" #singular
                elif token == "D": features["cardinality"] = "dual" #dual
                elif token == "P": features["cardinality"] = "plural" #plural
                else:
                    print "Unexpected token: ", part, piece
        elif part.startswith("STEM|"):
            for token in piece:
                if token == "1": features["person"] = "first" #first person
                elif token == "2": features["person"] = "second" #second person
                elif token == "3": features["person"] = "third" #third person
                elif token == "M": features["gender"] = "male" #male
                elif token == "F": features["gender"] = "female" #female
                elif token == "S": features["cardinality"] = "singular" #singular
                elif token == "D": features["cardinality"] = "dual" #dual
                elif token == "P": features["cardinality"] = "plural" #plural
                else:
                    print "Unexpected token: ", part, piece
        elif part.startswith("SUFFIX|"):
            if (piece == "+VOC"): features["particle"] = "vocative"
            elif (piece.find(":") > -1):
                colon = piece.find(":")
                after_colon = piece[colon+1:]
                if (after_colon == "EMPH"): features["particle"] = "emphasis"
                elif (after_colon == "P+"): features["particle"] = "preposition"
                else:
                    print "Unexpected token: ", part, piece
            else:
                print "Unexpected token: ", part, piece
        elif part.startswith("PREFIX|"):
            if (piece == "Al+"): {} # alif-lam
            elif (piece == "bi+"): {} # bi
            elif (piece == "ya+"): {} # ya
            elif (piece == "sa+"): {} # sa
            elif (piece == "ka+"): {} # ka
            elif (piece == "ha+"): {} # ha
            elif (piece == "ta+"): {} # ha
            elif (piece.find(":") > -1):
                colon = piece.find(":")
                after_colon = piece[colon+1:]
                if (after_colon == "CONJ+"): features["particle"] = "conjunction"
                elif (after_colon == "INTG+"): features["particle"] = "interrogative"
                elif (after_colon == "REM+"): features["particle"] = "resumption"
                elif (after_colon == "RSLT+"): features["particle"] = "result"
                elif (after_colon == "EMPH+"): features["particle"] = "emphatic"
                elif (after_colon == "PRP+"): features["particle"] = "supplemental"
                elif (after_colon == "CIRC+"): features["particle"] = "circumstantial"
                elif (after_colon == "SUP+"): features["particle"] = "supplemental"
                elif (after_colon == "EQ+"): features["particle"] = "equalization"
                elif (after_colon == "COM+"): features["particle"] = "comitative"
                elif (after_colon == "CAUS+"): features["particle"] = "cause"
                elif (after_colon == "IMPV+"): features["particle"] = "imperative"
                elif (after_colon == "P+"): features["particle"] = "preposition"
                else:
                    print "Unexpected token: ", part, piece
            else:
                print "Unexpected token: ", part, piece
        else:
            print "Unexpected token:", part, piece
    return features

file = open("quranic-corpus-morphology-0.4.txt")
output = open("quranic-corpus-morphology-0.4.js", "w")

output.write("exports.tokens = [\n")
for line in file:
    if line[0] == "(":
        output.write( getDocument(line).__str__().replace('\\\\', '\\') +",\n" )
output.write("];\n")
output.close()
