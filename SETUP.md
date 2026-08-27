# Setting this up, start to finish

Written for someone who is not a developer. Every step spells out exactly what to
click and what to copy. Set aside about 45 minutes for the first run. You only do
this once.

If a step doesn't look the way it's described here, that usually means Google has
moved a button, not that you did something wrong. The thing you're looking for is
named in each step.

---

## Before you start, read this part

This app handles patient health information. Three companies' computers touch that
information on its way to your Drive:

1. **Google** runs the app and stores the notes.
2. **Anthropic** runs Claude, which writes the note.
3. **Nobody else.** There is no database, no third-party analytics, no other vendor.

Both Google and Anthropic will sign a **BAA** (Business Associate Agreement) - the
contract HIPAA requires before another company may handle your patients' health
information. **Neither one is automatic. You have to ask for both.** Steps 2 and 5
tell you how.

**Until both BAAs are signed, test only with made-up patients.** "Test, Patient",
not a real person. This isn't a formality - using it on real patients before the
paperwork exists is the actual compliance problem, not the technology.

---

## Step 1 - Create a Google Cloud project

A "project" is just a container Google uses to group things you set up. It's free
to create.

1. Go to **https://console.cloud.google.com**
2. Sign in with **cg@peakwellnesshtx.com** - the same account your Drive is on.
   This matters. If you use a different account, the app won't find your folders.
3. At the top of the page there's a project dropdown (it may say "Select a
   project"). Click it, then click **New Project**.
4. Name it `pw-soap-notes`. Leave everything else alone. Click **Create**.
5. Wait a few seconds, then make sure the dropdown at the top now says
   **pw-soap-notes**. If it doesn't, click it and select it.

### Turn on billing

Google requires a credit card on file even for things that stay free.

1. In the search bar at the top, type **Billing** and open it.
2. Follow the prompts to link a billing account and add a card.

**What this will actually cost you:** roughly **$0 to $5 a month** for the hosting.
Cloud Run only charges while the app is actually being used, and a practice your
size will likely stay inside the free tier. The Claude API is billed separately by
Anthropic and runs roughly **$0.10 to $0.30 per note**.

---

## Step 2 - Sign Google's BAA

1. Go to **https://admin.google.com** (your Google Workspace admin console).
2. Search for **BAA** or navigate to **Account -> Account settings -> Legal and
   compliance**.
3. Find the **HIPAA Business Associate Amendment** and review and accept it.
4. Make sure **Google Drive** and **Google Cloud** are both listed as covered.

If you can't find it, contact Google Workspace support and ask: *"I need to
execute a HIPAA BAA covering Google Drive and Google Cloud Platform."* They handle
this routinely.

---

## Step 3 - Turn on the Google Drive API

This is what lets the app create Docs in your Drive.

1. In the search bar, type **Google Drive API** and open the result.
2. Click **Enable**.
3. That's the whole step.

---

## Step 4 - Create the login credentials

This is the fiddliest step. Take it slowly.

### 4a. The consent screen

1. Search for **OAuth consent screen** and open it.
2. If it asks for **User Type**, choose **Internal**. That restricts the app to
   your own peakwellnesshtx.com accounts, which is exactly what you want.
   - *If "Internal" is greyed out*, your Google account isn't a Workspace account.
     Choose **External** instead, and later add each staff member under **Test
     users**. Everything else works the same.
3. Fill in:
   - **App name:** `Peak Wellness SOAP Notes`
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue** through the remaining pages.

### 4b. The credentials

1. Search for **Credentials** and open it.
2. Click **+ Create Credentials** at the top -> **OAuth client ID**.
3. **Application type:** `Web application`
4. **Name:** `PW SOAP Notes`
5. Under **Authorized JavaScript origins**, click **+ Add URI** and enter:
   ```
   https://pw-soap-notes.example.run.app
   ```
   You don't know the real address yet. Put this placeholder in for now - **Step 8
   comes back and fixes it.** Google won't let you save an empty form.
6. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
   ```
   https://pw-soap-notes.example.run.app/setup/drive/callback
   ```
   Same deal, fixed in Step 8.
7. Click **Create**.
8. A box pops up with **Your Client ID** and **Your Client Secret**.
   **Copy both into a note somewhere safe right now.** The secret is shown once.

You now have:
- `GOOGLE_CLIENT_ID` - the long one ending in `.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` - the shorter one starting with `GOCSPX-`

---

## Step 5 - Get a Claude API key, and Anthropic's BAA

1. Go to **https://console.anthropic.com** and sign up or sign in.
2. Add a payment method under **Billing**. Put $20 on it to start; that's a lot of
   notes.
3. Go to **API Keys** -> **Create Key**. Name it `pw-soap-notes`.
4. **Copy the key immediately.** It starts with `sk-ant-` and is shown once.

### Ask for the BAA

Email **support@anthropic.com** (or use the support link in the console):

> I'm a healthcare provider using the Claude API for clinical documentation. I
> need to execute a HIPAA Business Associate Agreement before processing any
> patient health information. Please send me the BAA and let me know what plan or
> configuration is required.

**Wait for this to be signed before putting a real patient's information in.**

---

## Step 6 - Make a session secret

This is a random string the app uses to sign the login cookie so nobody can fake
being signed in. It isn't a password you'll ever type.

Easiest way: go to **https://www.random.org/strings/** and set it to generate
**4 strings**, **20 characters** each, with digits and both upper and lower case
enabled. Click **Get Strings**, then paste all four together into one long line
with no spaces.

Any long unpredictable string works. Just don't use a word or a phrase.

---

## Step 7 - Deploy the app

1. Go to **https://console.cloud.google.com** and make sure **pw-soap-notes** is
   the selected project.
2. Click the **`>_`** icon in the top right to open **Cloud Shell**. A terminal
   opens at the bottom of the screen. This is a computer Google gives you inside
   the browser; you don't have to install anything.
3. Paste this in and press Enter:
   ```
   git clone -b claude/soap-notes-phase-1-s8gb0p https://github.com/drcglenn/TGFPW.git
   cd TGFPW
   ```
4. Now paste this whole block. **Replace each `YOUR_...` with your real values**
   from the steps above. Keep the quote marks.
   ```
   gcloud run deploy pw-soap-notes \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "OWNER_EMAIL=cg@peakwellnesshtx.com" \
     --set-env-vars "ALLOWED_EMAILS=cg@peakwellnesshtx.com" \
     --set-env-vars "GOOGLE_CLIENT_ID=YOUR_CLIENT_ID" \
     --set-env-vars "GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET" \
     --set-env-vars "ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY" \
     --set-env-vars "SESSION_SECRET=YOUR_RANDOM_STRING"
   ```
5. It'll ask a couple of questions. Say yes to enabling any APIs it asks about.
6. After a few minutes it prints a line like:
   ```
   Service URL: https://pw-soap-notes-abc123-uc.a.run.app
   ```
   **Copy that address.** That's your app.

> **"--allow-unauthenticated" sounds wrong. Is it?**
> No. That flag only means Google's own infrastructure won't put a second login in
> front of the app. Your login is still enforced - nobody gets past the sign-in
> screen unless their email is in `ALLOWED_EMAILS`.

---

## Step 8 - Connect your Google Drive

Now go back and fix the placeholder addresses from Step 4.

1. Go back to **Credentials** in Google Cloud and click your **PW SOAP Notes**
   client to edit it.
2. Replace the placeholder in **Authorized JavaScript origins** with your real
   Service URL:
   ```
   https://pw-soap-notes-abc123-uc.a.run.app
   ```
3. Replace the placeholder in **Authorized redirect URIs** with:
   ```
   https://pw-soap-notes-abc123-uc.a.run.app/setup/drive/callback
   ```
4. Click **Save**. *Google can take a few minutes to apply this. If the next step
   errors, wait five minutes and try again.*
5. Open your Service URL in a browser and sign in with your Google account.
6. A yellow bar says Drive isn't connected. Click **Connect Google Drive**.
7. Approve the permission screen. Google may warn that the app isn't verified -
   that's expected for a private app you built. Click through it.
8. You'll land on a page with a long string in a box. **Copy the whole thing.**
   That's your `DRIVE_REFRESH_TOKEN`. Treat it like a password.

> **Why does it ask for access to all of Drive?**
> Google's narrower permission only lets an app see files it created itself. Your
> Documentation folder and all your patient folders already existed, so that
> narrower permission can't even list them, and Google has no in-between option
> for "just this one folder." The app only ever touches the Documentation folder,
> but the token you just copied carries broader access than that. Don't paste it
> anywhere except the command below.

Now save it. Back in Cloud Shell:
```
gcloud run services update pw-soap-notes \
  --region us-central1 \
  --update-env-vars "DRIVE_REFRESH_TOKEN=PASTE_IT_HERE" \
  --update-env-vars "PUBLIC_URL=https://pw-soap-notes-abc123-uc.a.run.app"
```

Reload the app. The yellow bar should be gone and your patient list should load.

---

## Step 9 - Test it with a fake patient

**Do this before you use it on anyone real.**

1. Click **Add new** and create `Test, Patient`.
2. Paste something rough into the notes box, the way you'd actually dictate:
   > test patient back today neck still tight but better says 4 out of 10 was 6
   > last time. upper traps tight both sides, levator on the right. adjusted C T L,
   > ten min manual therapy bilateral upper trap and levator, hot pack cervical,
   > chin tucks 3x15 bird dog 3x15. continue 2x a week for 4 weeks
3. Click **Check for missing info** and answer whatever it asks.
4. Click **Write the note** and read it carefully. Check the CPT codes, the regions,
   the diagnoses - everything a carrier would check.
5. Click **Save to Drive** and confirm the Doc landed in **PW Patient Resources ->
   Documentation -> Test, Patient**.
6. Open the Doc. The tables and shading should look like your existing notes.

Do this a few times before trusting it. **You are still the one signing these
notes.** Read every one before it goes in a chart.

---

## Step 10 - Add your staff

When you're ready, add their addresses:
```
gcloud run services update pw-soap-notes \
  --region us-central1 \
  --update-env-vars "ALLOWED_EMAILS=cg@peakwellnesshtx.com,mariana@peakwellnesshtx.com,giselle@peakwellnesshtx.com"
```

Removing someone is the same command without their address. **It takes effect
immediately** - they're locked out on their very next click, not whenever their
session expires.

---

## When something goes wrong

**"That account is not authorized to use this app."**
The email isn't in `ALLOWED_EMAILS`, or it's spelled differently. Re-run the
Step 10 command with the exact address.

**"Google Drive is not connected yet."**
`DRIVE_REFRESH_TOKEN` is missing or was rejected. Redo Step 8. If Google says it
won't issue a new token, go to **myaccount.google.com/permissions**, remove
"Peak Wellness SOAP Notes", and try again.

**"redirect_uri_mismatch" when connecting Drive**
The redirect URI in Step 8 doesn't exactly match your Service URL. It must include
`/setup/drive/callback` at the end, use `https`, and have no trailing slash.

**The sign-in button doesn't appear**
Your Service URL isn't in **Authorized JavaScript origins**. Step 8, item 2.

**"Could not read the patient list from Drive"**
Usually `DOCUMENTATION_FOLDER_ID` pointing somewhere that no longer exists. Open
the Documentation folder in Drive and look at the address bar - the folder ID is
the long string after `/folders/`.

**Everything is slow**
The first request after an idle period takes a few seconds while Cloud Run starts
up. Writing a note takes 20 to 60 seconds because Claude is doing real work. That
part is normal.

---

## Updating the app later

```
cd ~/TGFPW
git pull
gcloud run deploy pw-soap-notes --source . --region us-central1
```

Your settings and your Drive connection carry over. You don't redo any of the
above.
