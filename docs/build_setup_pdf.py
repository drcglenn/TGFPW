"""Builds the Peak Wellness SOAP Notes setup guide as a print-ready PDF.

    pip install reportlab
    python3 docs/build_setup_pdf.py

Writes Peak_Wellness_SOAP_Notes_Setup_Guide.pdf into the repository root. That
PDF is a generated artifact and is deliberately not committed.

SETUP.md is the source of truth for the steps themselves. If you change a step
there, change it here too, then regenerate.
"""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, KeepTogether, PageBreak,
)

import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO_ROOT, "Peak_Wellness_SOAP_Notes_Setup_Guide.pdf")

INK = colors.HexColor("#14161a")
MUTED = colors.HexColor("#5b6270")
LINE = colors.HexColor("#d8dce2")
BAR = colors.HexColor("#1a1a1a")
CODE_BG = colors.HexColor("#f2f4f7")
WARN_BG = colors.HexColor("#fff8e6")
WARN_LINE = colors.HexColor("#d9a520")
STOP_BG = colors.HexColor("#fdeeee")
STOP_LINE = colors.HexColor("#c0392b")
OK_BG = colors.HexColor("#eef7f1")
OK_LINE = colors.HexColor("#1c7a4a")

MARGIN = 0.7 * inch
PW, PH = LETTER
CONTENT_W = PW - 2 * MARGIN


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


S = {
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.7, leading=14,
                           textColor=INK, spaceAfter=7),
    "lead": ParagraphStyle("lead", fontName="Helvetica", fontSize=10.5, leading=15.5,
                           textColor=INK, spaceAfter=9),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=21, leading=25,
                         textColor=INK, spaceAfter=3),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                         textColor=INK, spaceBefore=4, spaceAfter=6),
    "sub": ParagraphStyle("sub", fontName="Helvetica-Bold", fontSize=9.7, leading=13,
                          textColor=INK, spaceBefore=6, spaceAfter=4),
    "bar": ParagraphStyle("bar", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
                          textColor=colors.white),
    "code": ParagraphStyle("code", fontName="Courier-Bold", fontSize=8.3, leading=12.4,
                           textColor=colors.HexColor("#111418")),
    "callout": ParagraphStyle("callout", fontName="Helvetica", fontSize=9.4, leading=13.4,
                              textColor=INK, spaceAfter=4),
    "calloutTitle": ParagraphStyle("calloutTitle", fontName="Helvetica-Bold", fontSize=9.6,
                                   leading=13, textColor=INK, spaceAfter=3),
    "li": ParagraphStyle("li", fontName="Helvetica", fontSize=9.7, leading=14,
                         textColor=INK, leftIndent=16, bulletIndent=3, spaceAfter=4),
    "note": ParagraphStyle("note", fontName="Helvetica-Oblique", fontSize=8.9, leading=12.5,
                           textColor=MUTED, spaceAfter=6),
    "brand": ParagraphStyle("brand", fontName="Helvetica-Bold", fontSize=11.5, leading=14,
                            textColor=INK, alignment=1),
    "brandsub": ParagraphStyle("brandsub", fontName="Helvetica", fontSize=8.6, leading=11.5,
                               textColor=MUTED, alignment=1),
    "cellL": ParagraphStyle("cellL", fontName="Helvetica-Bold", fontSize=8.8, leading=12,
                            textColor=INK),
    "cellR": ParagraphStyle("cellR", fontName="Helvetica", fontSize=8.8, leading=12,
                            textColor=INK),
    "blank": ParagraphStyle("blank", fontName="Helvetica", fontSize=8.4, leading=20,
                            textColor=MUTED),
    # Header cells sit on the dark bar, so they must be built white from the
    # start; a Paragraph bakes its colour in when it is constructed.
    "cellH": ParagraphStyle("cellH", fontName="Helvetica-Bold", fontSize=8.8, leading=12,
                            textColor=colors.white),
}


BAR_STYLE = ParagraphStyle(
    "barp", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
    textColor=colors.white, backColor=BAR,
    borderPadding=(5, 8, 5, 8), spaceBefore=14, spaceAfter=9,
    keepWithNext=1,  # a section bar never sits alone at the foot of a page
)


def bar(text):
    """Dark full-width section bar, matching the practice's note styling."""
    return Paragraph(esc(text), BAR_STYLE)


def code(lines, indent=0):
    """Monospace command block. Lines wrap inside the box, never off the page."""
    def render(l):
        if not l:
            return "&nbsp;"
        stripped = l.lstrip(" ")
        return "&nbsp;" * (len(l) - len(stripped)) + esc(stripped)

    body = "<br/>".join(render(l) for l in lines)
    w = CONTENT_W - indent
    t = Table([[Paragraph(body, S["code"])]], colWidths=[w])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    if indent:
        outer = Table([["", t]], colWidths=[indent, w])
        outer.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return outer
    return t


def callout(title, paras, kind="warn"):
    bg, edge = {"warn": (WARN_BG, WARN_LINE),
                "stop": (STOP_BG, STOP_LINE),
                "ok": (OK_BG, OK_LINE)}[kind]
    flow = []
    if title:
        flow.append(Paragraph(esc(title), S["calloutTitle"]))
    for p in paras:
        flow.append(Paragraph(p, S["callout"]))
    t = Table([[flow]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, edge),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def steps(items):
    """Numbered list where each item wraps cleanly."""
    out = []
    for i, txt in enumerate(items, 1):
        out.append(Paragraph(txt, S["li"], bulletText=f"{i}."))
    return out


def bullets(items):
    return [Paragraph(t, S["li"], bulletText="•") for t in items]


def header_footer(canvas, doc):
    canvas.saveState()
    # Header rule and brand line, from page 2 on
    if doc.page > 1:
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN, PH - MARGIN + 16, "Peak Wellness SOAP Notes")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(PW - MARGIN, PH - MARGIN + 16, "Setup Guide")
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(MARGIN, PH - MARGIN + 10, PW - MARGIN, PH - MARGIN + 10)
    # Footer
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, MARGIN - 12, PW - MARGIN, MARGIN - 12)
    canvas.setFont("Helvetica", 7.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, MARGIN - 24, "Peak Wellness Sports Chiropractic")
    canvas.drawRightString(PW - MARGIN, MARGIN - 24, f"Page {doc.page}")
    canvas.restoreState()


# ===========================================================================
# Content
# ===========================================================================
story = []
A = story.append

# --- Title block -----------------------------------------------------------
A(Paragraph("Peak Wellness Sports Chiropractic", S["brand"]))
A(Paragraph("Dr. Caleb Glenn, DC, IMT&nbsp; |&nbsp; 711 Avenue E, Stafford, TX 77477", S["brandsub"]))
A(Spacer(1, 16))
A(Paragraph("SOAP Notes App: Setup Guide", S["h1"]))
A(Paragraph(
    "Everything you need to go get, and exactly what to click, in order. "
    "Written assuming you are not a developer. Roughly 45 minutes, one time only.",
    S["lead"]))
A(Spacer(1, 4))

A(callout("Read this part first.", [
    "This app handles patient health information. Three companies' computers touch that "
    "information on its way to your Drive: <b>Google</b> runs the app and stores the notes, "
    "<b>Anthropic</b> runs Claude which writes the note, and <b>nobody else</b>. There is no "
    "database, no analytics, no other vendor.",
    "Google and Anthropic will each sign a <b>BAA</b>, the contract HIPAA requires before "
    "another company may handle your patients' health information. <b>Neither is automatic. "
    "You have to ask for both.</b> Steps 2 and 5 tell you how.",
    "<b>Until both BAAs are signed, test only with made-up patients.</b> \"Test, Patient\", "
    "not a real person. Using it on real patients before the paperwork exists is the actual "
    "compliance problem, not the technology.",
], "stop"))
A(Spacer(1, 12))

A(bar("WHAT YOU WILL COLLECT ALONG THE WAY"))
A(Spacer(1, 6))
A(Paragraph(
    "Six values, gathered across four different websites. There is a worksheet on the last "
    "page to write them down as you go. Keep that page somewhere safe, or shred it once you "
    "are set up.", S["body"]))

rows = [
    [Paragraph("Value", S["cellH"]), Paragraph("Where it comes from", S["cellH"]), Paragraph("Step", S["cellH"])],
    [Paragraph("GOOGLE_CLIENT_ID", S["cellR"]), Paragraph("Google Cloud, Credentials page", S["cellR"]), Paragraph("4", S["cellR"])],
    [Paragraph("GOOGLE_CLIENT_SECRET", S["cellR"]), Paragraph("Same screen, shown once", S["cellR"]), Paragraph("4", S["cellR"])],
    [Paragraph("ANTHROPIC_API_KEY", S["cellR"]), Paragraph("console.anthropic.com", S["cellR"]), Paragraph("5", S["cellR"])],
    [Paragraph("SESSION_SECRET", S["cellR"]), Paragraph("A random string you generate", S["cellR"]), Paragraph("6", S["cellR"])],
    [Paragraph("Service URL", S["cellR"]), Paragraph("Printed when the app deploys", S["cellR"]), Paragraph("7", S["cellR"])],
    [Paragraph("DRIVE_REFRESH_TOKEN", S["cellR"]), Paragraph("The app itself, after you approve", S["cellR"]), Paragraph("8", S["cellR"])],
]
t = Table(rows, colWidths=[1.85 * inch, 3.5 * inch, 0.75 * inch])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BAR),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafbfc")]),
]))
A(t)
A(Spacer(1, 8))
A(Paragraph(
    "If a screen does not look the way it is described here, that usually means Google moved a "
    "button, not that you did something wrong. The thing you are looking for is named in each step.",
    S["note"]))
A(Spacer(1, 12))

# --- Step 1 ----------------------------------------------------------------
A(bar("STEP 1  ·  CREATE A GOOGLE CLOUD PROJECT"))
A(Paragraph("A \"project\" is just a container Google uses to group things you set up. Free to create.", S["body"]))
A(Spacer(1, 2))
for f in steps([
    "Go to <b>console.cloud.google.com</b>",
    "Sign in with <b>cg@peakwellnesshtx.com</b>, the same account your Drive is on. This matters. "
    "A different account will not find your folders.",
    "At the top there is a project dropdown, possibly saying \"Select a project\". Click it, then "
    "click <b>New Project</b>.",
    "Name it <b>pw-soap-notes</b>. Leave everything else alone. Click <b>Create</b>.",
    "Wait a few seconds, then confirm the dropdown at the top now says <b>pw-soap-notes</b>. If not, "
    "click it and select it.",
]):
    A(f)

A(Paragraph("Turn on billing", S["sub"]))
A(Paragraph(
    "Google requires a card on file even for things that stay free. In the search bar at the top, "
    "type <b>Billing</b>, open it, and follow the prompts to link an account and add a card.", S["body"]))
A(Spacer(1, 4))
A(callout("What this actually costs.", [
    "Roughly <b>$0 to $5 a month</b> for hosting. Cloud Run only charges while the app is being "
    "used, and a practice your size will likely stay inside the free tier. The Claude API is billed "
    "separately by Anthropic at roughly <b>$0.10 to $0.30 per note</b>.",
], "ok"))
A(Spacer(1, 14))

# --- Step 2 ----------------------------------------------------------------
A(bar("STEP 2  ·  SIGN GOOGLE'S BAA"))
for f in steps([
    "Go to <b>admin.google.com</b>, your Google Workspace admin console.",
    "Search for <b>BAA</b>, or navigate to <b>Account &gt; Account settings &gt; Legal and compliance</b>.",
    "Find the <b>HIPAA Business Associate Amendment</b>, review it, and accept it.",
    "Confirm <b>Google Drive</b> and <b>Google Cloud</b> are both listed as covered.",
]):
    A(f)
A(Spacer(1, 2))
A(Paragraph(
    "If you cannot find it, contact Google Workspace support and say: <i>\"I need to execute a HIPAA "
    "BAA covering Google Drive and Google Cloud Platform.\"</i> They handle this routinely.", S["body"]))
A(Spacer(1, 14))

# --- Step 3 ----------------------------------------------------------------
A(KeepTogether([
    bar("STEP 3  ·  TURN ON THE GOOGLE DRIVE API"),
    Paragraph("This is what lets the app create Docs in your Drive.", S["body"]),
    Spacer(1, 2),
    Paragraph("In the search bar, type <b>Google Drive API</b> and open the result.", S["li"], bulletText="1."),
    Paragraph("Click <b>Enable</b>.", S["li"], bulletText="2."),
    Paragraph("That is the whole step.", S["li"], bulletText="3."),
]))


# --- Step 4 ----------------------------------------------------------------
A(bar("STEP 4  ·  CREATE THE LOGIN CREDENTIALS"))
A(Paragraph("This is the fiddliest step. Take it slowly.", S["body"]))

A(Paragraph("4a.  The consent screen", S["sub"]))
for f in steps([
    "Search for <b>OAuth consent screen</b> and open it.",
    "If it asks for <b>User Type</b>, choose <b>Internal</b>. That restricts the app to your own "
    "peakwellnesshtx.com accounts, which is exactly what you want.",
    "Fill in <b>App name</b>: Peak Wellness SOAP Notes. <b>User support email</b> and "
    "<b>Developer contact</b>: your email.",
    "Click <b>Save and Continue</b> through the remaining pages.",
]):
    A(f)
A(Paragraph(
    "If \"Internal\" is greyed out, your Google account is not a Workspace account. Choose "
    "<b>External</b> instead, and later add each staff member under <b>Test users</b>. Everything "
    "else works the same.", S["note"]))

A(Paragraph("4b.  The credentials", S["sub"]))
for f in steps([
    "Search for <b>Credentials</b> and open it.",
    "Click <b>+ Create Credentials</b> at the top, then <b>OAuth client ID</b>.",
    "<b>Application type:</b> Web application. &nbsp;<b>Name:</b> PW SOAP Notes.",
    "Under <b>Authorized JavaScript origins</b>, click <b>+ Add URI</b> and enter the placeholder below.",
]):
    A(f)
A(code(["https://pw-soap-notes.example.run.app"], indent=16))
A(Spacer(1, 6))
A(Paragraph("Under <b>Authorized redirect URIs</b>, click <b>+ Add URI</b> and enter:", S["li"], bulletText="5."))
A(code(["https://pw-soap-notes.example.run.app/setup/drive/callback"], indent=16))
A(Spacer(1, 6))
A(Paragraph("Click <b>Create</b>.", S["li"], bulletText="6."))
A(Paragraph(
    "A box pops up with <b>Your Client ID</b> and <b>Your Client Secret</b>. "
    "<b>Write both on the worksheet at the back right now.</b> The secret is shown once.",
    S["li"], bulletText="7."))
A(Spacer(1, 4))
A(callout("Those addresses are placeholders, on purpose.", [
    "You do not know your real address yet. Google will not let you save an empty form, so you put "
    "something valid-looking in now and <b>Step 8 comes back and replaces both of them</b> with the "
    "real one.",
], "warn"))
A(Spacer(1, 14))

# --- Step 5 ----------------------------------------------------------------
A(bar("STEP 5  ·  GET A CLAUDE API KEY, AND ANTHROPIC'S BAA"))
for f in steps([
    "Go to <b>console.anthropic.com</b> and sign up or sign in.",
    "Add a payment method under <b>Billing</b>. Put $20 on it to start. That is a lot of notes.",
    "Go to <b>API Keys</b>, then <b>Create Key</b>. Name it <b>pw-soap-notes</b>.",
    "<b>Copy the key immediately</b> onto the worksheet. It starts with sk-ant- and is shown once.",
]):
    A(f)
A(Paragraph("Ask for the BAA", S["sub"]))
A(Paragraph("Email <b>support@anthropic.com</b>, or use the support link in the console:", S["body"]))
A(callout(None, [
    "<i>I am a healthcare provider using the Claude API for clinical documentation. I need to execute "
    "a HIPAA Business Associate Agreement before processing any patient health information. Please "
    "send me the BAA and let me know what plan or configuration is required.</i>",
], "warn"))
A(Spacer(1, 6))
A(Paragraph(
    "<b>Wait for this to be signed before putting a real patient's information in.</b> You can finish "
    "the rest of setup and test with fake patients while you wait.", S["body"]))

# --- Step 6 ----------------------------------------------------------------
A(bar("STEP 6  ·  MAKE A SESSION SECRET"))
A(Paragraph(
    "This is a random string the app uses to sign the login cookie so nobody can fake being signed "
    "in. It is not a password you will ever type.", S["body"]))
A(Paragraph(
    "Easiest way: go to <b>random.org/strings</b>. Set it to generate <b>4 strings</b>, "
    "<b>20 characters</b> each, with digits and both upper and lower case enabled. Click "
    "<b>Get Strings</b>, then paste all four together into one long line with no spaces.", S["body"]))
A(Paragraph("Any long unpredictable string works. Just do not use a word or a phrase.", S["note"]))
A(Spacer(1, 14))

# --- Step 7 ----------------------------------------------------------------
A(bar("STEP 7  ·  DEPLOY THE APP"))
for f in steps([
    "Go to <b>console.cloud.google.com</b> and make sure <b>pw-soap-notes</b> is the selected project.",
    "Click the <b>&gt;_</b> icon in the top right to open <b>Cloud Shell</b>. A terminal opens at the "
    "bottom of the screen. This is a computer Google gives you inside the browser. You do not have to "
    "install anything.",
    "Paste this in and press Enter:",
]):
    A(f)
A(code([
    "git clone -b claude/soap-notes-phase-1-s8gb0p \\",
    "  https://github.com/drcglenn/TGFPW.git",
    "cd TGFPW",
], indent=16))
A(Spacer(1, 8))
A(Paragraph(
    "Now paste the whole block below. <b>Replace each YOUR_... with your real value</b> from the "
    "worksheet. Keep the quote marks and the backslashes exactly where they are.",
    S["li"], bulletText="4."))
A(code([
    "gcloud run deploy pw-soap-notes \\",
    "  --source . \\",
    "  --region us-central1 \\",
    "  --allow-unauthenticated \\",
    '  --set-env-vars "OWNER_EMAIL=cg@peakwellnesshtx.com" \\',
    '  --set-env-vars "ALLOWED_EMAILS=cg@peakwellnesshtx.com" \\',
    '  --set-env-vars "GOOGLE_CLIENT_ID=YOUR_CLIENT_ID" \\',
    '  --set-env-vars "GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET" \\',
    '  --set-env-vars "ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY" \\',
    '  --set-env-vars "SESSION_SECRET=YOUR_RANDOM_STRING"',
], indent=16))
A(Spacer(1, 8))
A(Paragraph("It will ask a couple of questions. Say yes to enabling any APIs it asks about.",
            S["li"], bulletText="5."))
A(Paragraph("After a few minutes it prints a line like this. <b>Copy that address onto the "
            "worksheet.</b> That is your app.", S["li"], bulletText="6."))
A(code(["Service URL: https://pw-soap-notes-abc123-uc.a.run.app"], indent=16))
A(Spacer(1, 8))
A(callout("\"--allow-unauthenticated\" sounds wrong. Is it?", [
    "No. That flag only means Google's own infrastructure will not put a <i>second</i> login in front "
    "of the app. Your login is still enforced. Nobody gets past the sign-in screen unless their email "
    "is on your allowed list.",
], "warn"))


# --- Step 8 ----------------------------------------------------------------
A(bar("STEP 8  ·  CONNECT YOUR GOOGLE DRIVE"))
A(Paragraph("Now go back and replace the placeholder addresses from Step 4 with your real one.", S["body"]))
for f in steps([
    "Go back to <b>Credentials</b> in Google Cloud and click your <b>PW SOAP Notes</b> client to edit it.",
    "Replace the placeholder in <b>Authorized JavaScript origins</b> with your real Service URL:",
]):
    A(f)
A(code(["https://pw-soap-notes-abc123-uc.a.run.app"], indent=16))
A(Spacer(1, 6))
A(Paragraph("Replace the placeholder in <b>Authorized redirect URIs</b> with:", S["li"], bulletText="3."))
A(code(["https://pw-soap-notes-abc123-uc.a.run.app/setup/drive/callback"], indent=16))
A(Spacer(1, 6))
for i, txt in enumerate([
    "Click <b>Save</b>. Google can take a few minutes to apply this. If the next step errors, wait "
    "five minutes and try again.",
    "Open your Service URL in a browser and sign in with your Google account.",
    "A yellow bar says Drive is not connected. Click <b>Connect Google Drive</b>.",
    "Approve the permission screen. Google may warn that the app is not verified. That is expected "
    "for a private app you built. Click through it.",
    "You land on a page with a long string in a box. <b>Copy the whole thing.</b> That is your "
    "DRIVE_REFRESH_TOKEN. Treat it like a password.",
], 4):
    A(Paragraph(txt, S["li"], bulletText=f"{i}."))
A(Spacer(1, 4))
A(callout("Why does it ask for access to all of Drive?", [
    "Google's narrower permission only lets an app see files it created itself. Your Documentation "
    "folder and all your patient folders already existed, so that narrower permission cannot even "
    "list them, and Google has no in-between option for \"just this one folder.\"",
    "The app only ever touches the Documentation folder, but the token you just copied carries "
    "broader access than that. Do not paste it anywhere except the command below.",
], "warn"))
A(Spacer(1, 8))
A(Paragraph("Now save it. Back in Cloud Shell:", S["body"]))
A(code([
    "gcloud run services update pw-soap-notes \\",
    "  --region us-central1 \\",
    '  --update-env-vars "DRIVE_REFRESH_TOKEN=PASTE_IT_HERE" \\',
    '  --update-env-vars "PUBLIC_URL=https://pw-soap-notes-abc123-uc.a.run.app"',
]))
A(Spacer(1, 8))
A(Paragraph(
    "Reload the app. The yellow bar should be gone and your patient list should load. "
    "<b>That is setup finished.</b>", S["body"]))


# --- Step 9 ----------------------------------------------------------------
A(bar("STEP 9  ·  TEST IT WITH A FAKE PATIENT"))
A(callout("Do this before you use it on anyone real.", [
    "The app was built and tested, but nobody has yet watched it write a note against the live "
    "Claude model. The first few notes are the ones to read hardest.",
], "stop"))
A(Spacer(1, 8))
for f in steps([
    "Click <b>Add new</b> and create <b>Test, Patient</b>.",
    "Paste something rough into the notes box, the way you would actually dictate it:",
]):
    A(f)
A(code([
    "test patient back today neck still tight but better",
    "says 4 out of 10 was 6 last time. upper traps tight",
    "both sides, levator on the right. adjusted C T L, ten",
    "min manual therapy bilateral upper trap and levator,",
    "hot pack cervical, chin tucks 3x15 bird dog 3x15.",
    "continue 2x a week for 4 weeks",
], indent=16))
A(Spacer(1, 8))
for i, txt in enumerate([
    "Click <b>Check for missing info</b> and answer whatever it asks.",
    "Click <b>Write the note</b> and read it carefully. Check the CPT codes, the regions, the "
    "diagnoses. Everything a carrier would check.",
    "Click <b>Save to Drive</b> and confirm the Doc landed in <b>PW Patient Resources &gt; "
    "Documentation &gt; Test, Patient</b>.",
    "Open the Doc. The tables and shading should look like your existing notes.",
], 3):
    A(Paragraph(txt, S["li"], bulletText=f"{i}."))
A(Spacer(1, 6))
A(Paragraph(
    "Run through this a few times before trusting it. <b>You are still the one signing these notes.</b> "
    "Read every one before it goes in a chart.", S["body"]))
A(Spacer(1, 14))

# --- Step 10 ---------------------------------------------------------------
A(bar("STEP 10  ·  ADD YOUR STAFF"))
A(Paragraph("When you are ready, add their addresses:", S["body"]))
A(code([
    'EMAILS="cg@peakwellnesshtx.com,mariana@peakwellnesshtx.com"',
    "",
    "gcloud run services update pw-soap-notes \\",
    "  --region us-central1 \\",
    '  --update-env-vars "ALLOWED_EMAILS=$EMAILS"',
]))
A(Spacer(1, 6))
A(Paragraph(
    "Put every address that should have access on that first line, separated by commas with no "
    "spaces. It is one line no matter how many people are on it.", S["note"]))
A(Spacer(1, 8))
A(Paragraph(
    "Removing someone is the same command without their address. <b>It takes effect immediately.</b> "
    "They are locked out on their very next click, not whenever their session happens to expire.",
    S["body"]))


# --- Troubleshooting -------------------------------------------------------
A(bar("WHEN SOMETHING GOES WRONG"))

trouble = [
    ("\"That account is not authorized to use this app.\"",
     "The email is not in your allowed list, or it is spelled differently. Re-run the Step 10 "
     "command with the exact address."),
    ("\"Google Drive is not connected yet.\"",
     "The refresh token is missing or was rejected. Redo Step 8. If Google will not issue a new "
     "token, go to myaccount.google.com/permissions, remove \"Peak Wellness SOAP Notes\", and try again."),
    ("\"redirect_uri_mismatch\" when connecting Drive",
     "The redirect URI does not exactly match your Service URL. It must end in /setup/drive/callback, "
     "use https, and have no trailing slash."),
    ("The sign-in button does not appear",
     "Your Service URL is not in Authorized JavaScript origins. Step 8, item 2."),
    ("\"Could not read the patient list from Drive\"",
     "Usually the Documentation folder ID pointing somewhere that no longer exists. Open the "
     "Documentation folder in Drive and look at the address bar. The folder ID is the long string "
     "after /folders/."),
    ("Everything is slow",
     "The first request after an idle period takes a few seconds while the app wakes up. Writing a "
     "note takes 20 to 60 seconds because Claude is doing real work. That part is normal."),
]
rows = [[Paragraph("Symptom", S["cellH"]), Paragraph("What to do", S["cellH"])]]
for sym, fix in trouble:
    rows.append([Paragraph(esc(sym), S["cellL"]), Paragraph(esc(fix), S["cellR"])])

t = Table(rows, colWidths=[2.25 * inch, 4.85 * inch])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), BAR),
    ("GRID", (0, 0), (-1, -1), 0.6, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafbfc")]),
]))
A(t)
A(Spacer(1, 16))

A(bar("UPDATING THE APP LATER"))
A(Paragraph("In Cloud Shell:", S["body"]))
A(code([
    "cd ~/TGFPW",
    "git pull",
    "gcloud run deploy pw-soap-notes --source . --region us-central1",
]))
A(Spacer(1, 8))
A(Paragraph(
    "Your settings and your Drive connection carry over. You do not redo any of the setup above.",
    S["body"]))

A(PageBreak())

# --- Worksheet -------------------------------------------------------------
A(Paragraph("Worksheet", S["h1"]))
A(Paragraph(
    "Write each value here as you collect it. Several of these are shown only once, so capture them "
    "the moment they appear. Keep this page somewhere safe, or shred it once the app is running.",
    S["lead"]))
A(Spacer(1, 2))
A(callout("These are passwords, effectively.", [
    "Anyone holding the client secret, the API key, or the Drive token can reach your account. Do not "
    "email them, do not put them in a shared doc, and do not leave this page at the front desk.",
], "stop"))
A(Spacer(1, 10))

sheet = [
    ("GOOGLE_CLIENT_ID", "Step 4b · ends in .apps.googleusercontent.com", 2),
    ("GOOGLE_CLIENT_SECRET", "Step 4b · starts with GOCSPX- · shown once", 1),
    ("ANTHROPIC_API_KEY", "Step 5 · starts with sk-ant- · shown once", 1),
    ("SESSION_SECRET", "Step 6 · your long random string", 1),
    ("Service URL", "Step 7 · printed when the app deploys", 1),
    ("DRIVE_REFRESH_TOKEN", "Step 8 · long string · shown once", 2),
]
for label, hint, lines in sheet:
    A(Paragraph(esc(label), S["h2"]))
    A(Paragraph(esc(hint), S["note"]))
    body = [[Paragraph("", S["blank"])] for _ in range(lines)]
    t = Table(body, colWidths=[CONTENT_W], rowHeights=[20] * lines)
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    A(t)
    A(Spacer(1, 5))

A(Spacer(1, 2))
A(callout("Two things that are not done until you do them.", [
    "<b>Google BAA</b> (Step 2) &nbsp;&nbsp;signed on ______________",
    "<b>Anthropic BAA</b> (Step 5) &nbsp;&nbsp;requested ______________ &nbsp;&nbsp;signed ______________",
    "Real patient information does not go through this app until both of those dates are filled in.",
], "warn"))


# ===========================================================================
doc = BaseDocTemplate(
    OUT, pagesize=LETTER,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN + 6,
    title="Peak Wellness SOAP Notes - Setup Guide",
    author="Peak Wellness Sports Chiropractic",
    subject="Setup instructions for the Phase 1 SOAP note app",
)
frame = Frame(MARGIN, MARGIN + 6, CONTENT_W, PH - 2 * MARGIN - 6, id="body",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])
doc.build(story)
print("built:", OUT)
