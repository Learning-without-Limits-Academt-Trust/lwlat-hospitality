# LWLAT catering bookings

A booking form for staff to request hospitality or packed lunches, and an admin page where the Catering Team can see, confirm and manage the requests. The booking form is open to anyone with the link. The Catering Team signs in to the admin page with their LWLAT Microsoft account.

- **Booking form:** `https://<your-site>.netlify.app/`
- **Catering admin:** `https://<your-site>.netlify.app/admin`

Everything runs on Netlify. Bookings are stored in Netlify's own storage (Netlify Blobs), so there is no separate database or account to look after.

## What is in the folder

| File | What it does |
| --- | --- |
| `public/index.html` | The booking form that staff fill in |
| `public/admin.html` | The Catering Team's page, open only to people with the Catering admin role |
| `public/styles.css` | Shared colours, type and layout (trust teal #009f9a) |
| `public/auth.js` | Microsoft sign-in for the Catering Team |
| `public/vendor/` | Microsoft's sign-in library (MSAL 4.30.0, MIT licence), kept here so the site does not depend on another server |
| `netlify/functions/bookings.mjs` | The small piece of server code that saves and returns bookings |
| `netlify/functions/config.mjs` | Tells the pages which Microsoft app to sign in with |
| `netlify/lib/auth.mjs` | Checks each sign-in with Microsoft and whether the person has the Catering admin role |
| `netlify/lib/notify.mjs` | Sends the email alerts |
| `netlify.toml` | Tells Netlify where each part lives |

## Putting it live on Netlify

1. Sign in to Netlify and choose **Add new site**, then **Import an existing project**.
2. Pick GitHub and choose the `lwlat-hospitality` repository.
3. Leave the build settings as Netlify suggests. It reads them from `netlify.toml`.
4. Before the first deploy, open **Site configuration**, then **Environment variables**, and add the two IDs from IT's "LWLAT Catering Bookings" app registration:

   | Key | Value |
   | --- | --- |
   | `ENTRA_TENANT_ID` | Directory (tenant) ID |
   | `ENTRA_CLIENT_ID` | Application (client) ID |

5. Deploy the site. Netlify will give it an address ending in `.netlify.app`.
6. Check with IT that this exact address, with a `/` on the end, is the **Single-page application** redirect URI on the app registration. If you add your own domain later, IT must add that address too, or sign-in will fail with an error mentioning "redirect URI".
7. Test it: send a booking from the form, then open `/admin`, sign in with a Catering Team account and check it appears.

## Who can do what

| Person | Booking form | Catering Team page |
| --- | --- | --- |
| Anyone with the link | Books without signing in | No access |
| LWLAT staff not in the Catering Team | Books without signing in | No access, even if they sign in |
| Catering Team (Catering admin role) | Books, and uses **Add a booking** for phone and past orders | Full access after Microsoft sign-in |
| Finance (Catering finance role) | Books without signing in | Sees every booking and its cost after Microsoft sign-in. Cannot change, confirm or delete anything |

The Catering Team is the agreed list of people IT has given the **Catering admin** role on the "LWLAT Catering Bookings" app in Entra. To add or remove someone, ask IT to change that list. Nothing changes on the website.

Because only the Catering Team now signs in, IT can also switch on **Assignment required** for the app (Enterprise applications, then Properties). Microsoft will then refuse sign-in to anyone not on the list before they reach the site.

### Giving Finance access

Finance staff need a second app role on the same "LWLAT Catering Bookings" app. Please ask IT to:

1. In Entra, open **App registrations**, then **LWLAT Catering Bookings**, then **App roles**, and choose **Create app role**.
2. Display name **Catering finance**, allowed member types **Users/Groups**, value **Catering.Finance** (exactly), description "View bookings and their costs". Tick **Enable this app role**.
3. In **Enterprise applications**, then **LWLAT Catering Bookings**, then **Users and groups**, add each finance person (or a finance group) with the **Catering finance** role.

Finance staff then sign in at `/admin` in the usual way. The page says "Finance (view only)" at the top. Nothing on the website needs changing.

## Order costs

Each booking has a cost, worked out from the hospitality price list. The cost is kept on the server and is only ever sent to people signed in with the Catering admin or Catering finance role. It is never sent to the booking form, and it is not in any email.

- **When a booking arrives**, the site suggests a cost from what was chosen on the form and the number of people. It is marked **Suggested** and shown as "(est.)" on the list.
- **The Catering Team checks it.** In the booking, the **Cost** section lists each item, its price, quantity and total. Change anything that is wrong, add lines with **Add a line**, then press **Save costing**. It is then marked **Checked**, with who checked it and when.
- **Finance** sees the same cost table, the total on each booking, a daily total beside each date, and three cost columns in **Download spreadsheet**.

How form choices are suggested:

| On the form | Suggested as (per person) |
| --- | --- |
| Tea, coffee and biscuits | Tea / Coffee and Biscuits |
| Cold drinks and water | Juice Carton |
| Pastry selection | Half Croissant, half Pain Au Choc |
| Sandwich platters | A line with no price, for the Catering Team to price |
| Small buffet (3 items) | Basic Buffet (3 item) |
| Large buffet (5 items) | Premium Buffet (5 item) |
| Cakes and sweet treats | Cake |
| Fruit bowl | Fruit Bowl |
| Other | Nothing. The Catering Team adds lines by hand |
| Every packed lunch | Grab Bag (Tiffin), £6.54 each |

**To change a price**, edit `netlify/lib/prices.mjs` and redeploy. The prices came from the "Hospitality Costing" spreadsheet. Costings already saved keep the prices they were saved with. The suggestions above are set in the same file.

## Email alerts for catering managers

When someone sends a booking, the catering manager for that site gets an email with the full order, any allergy details and a link to the bookings page. A trust contact can be copied on every booking. Replying to the alert goes to the person who made the booking. Bookings the Catering Team adds themselves do not send an alert.

The alerts are sent through the trust's Microsoft 365 from one mailbox. Until the settings below are in place, bookings still work but no alerts are sent.

**From IT** (see the request below), add these in Netlify under **Site configuration**, then **Environment variables**:

| Key | Value |
| --- | --- |
| `GRAPH_TENANT_ID` | Directory (tenant) ID |
| `GRAPH_CLIENT_ID` | Application (client) ID of the email app |
| `GRAPH_CLIENT_SECRET` | The client secret value. Mark it as secret in Netlify. |
| `NOTIFY_FROM` | Optional. The mailbox alerts come from. If left out, `catering-notifications@lwlat.org.uk` is used. |

**Who gets told.** Add one key per site. Each can hold several addresses separated by commas.

| Key | Who it is for |
| --- | --- |
| `NOTIFY_BABINGTON` | Babington catering manager |
| `NOTIFY_HEATHERBROOK` | Heatherbrook catering manager |
| `NOTIFY_LANCASTER` | Lancaster catering manager |
| `NOTIFY_SOUTH_WIGSTON` | South Wigston catering manager |
| `NOTIFY_WOODSTOCK` | Woodstock catering manager |
| `NOTIFY_CENTRAL_TEAM` | Central Team bookings |
| `NOTIFY_TRUST` | Copied on every booking, whichever site |

To change who is told, edit these values in Netlify and redeploy. No code changes are needed. When you add or edit a variable, make sure its scopes include **Functions**, then go to **Deploys** and choose **Trigger deploy**. Netlify only picks up new values on the next deploy.

**Checking alerts are working.** On the admin page:

- Open any booking. Under **Email alert** it says who the alert went to, or why it was not sent. Bookings added with **Add a booking** never send alerts.
- Choose **Test email alerts**. It sends one test email to you only, not to the managers, and lists where each site's alerts will go. If something is wrong, it says what, for example a missing setting, a rejected secret or a mailbox the app cannot send from.

**What IT needs to set up:** an app registration with the Microsoft Graph application permission `Mail.Send`, with admin consent and a client secret. It should be limited to the sending mailbox only, using RBAC for Applications in Exchange Online or an application access policy. The secret expires, usually after 12 or 24 months, and must be renewed in Netlify before then.

## Changing the menus or notice period

Open `public/index.html` and look for the section headed **settings the Catering Team may want to change** near the bottom. You can edit:

- `MIN_NOTICE_WORKING_DAYS`, the number of working days' notice needed
- `HOSPITALITY_ITEMS`, the hospitality menu
- `LUNCH_OPTIONS`, the packed lunch choices

Keep each item inside quotation marks and followed by a comma. Old bookings keep the wording they were made with.

## Design

The pages follow the LwLAT Pulse "Concept C" design (brand guidelines v1.0): a fixed teal backdrop with a faint grid and ring arcs, white "window" cards, glass pills, an orange notice bar and light-green focus rings. Colours are the brand palette only, defined at the top of `public/styles.css`. Source Sans 3 stands in for The Sans, the brand typeface. If the trust has a web licence for The Sans, add its files and put its name first in `--font`.

To keep text readable, the bright mission teal sits at the top right of the backdrop rather than the top left, and small white text on teal always has a dark glass backing. All text on the backdrop meets WCAG AA.

## Adding the trust logo

Save the white (reversed) master logo as `public/lwlat-logo.svg` (or a PNG, and change the file name to match). Then, near the top of `index.html` and `admin.html`, remove the word `hidden` from the `<img>` line and delete the `wordmark-text` line under it. Keep the logo at least 120px wide with the brand clear space.

## Booking references

Each booking gets a reference made of the site's code, the booking date as ddmmyy, and a number counting up from 001 for that site and date. For example, the first South Wigston booking for 27 October 2026 is `swhs271026001`, and the next one for that day is `swhs271026002`.

| Site | Code |
| --- | --- |
| Babington | `ba` |
| Heatherbrook | `hpa` |
| Lancaster | `la` |
| South Wigston | `swhs` |
| Woodstock | `wpa` |
| Central Team | `ct` |

To change a code, edit `SITE_CODES` near the top of `netlify/functions/bookings.mjs`. Existing bookings keep their reference.

## Replying to a booking

Open a booking on the admin page. The box at the top has two buttons:

- **Confirm order and email [name]** marks the booking Confirmed and emails the booker straight away with their order details. Replies come to the team member who confirmed it. The box then shows who it was sent to and when. If the email could not be sent, it says why and offers a link to email the booker yourself.
- **Ask for more information** opens a ready-addressed email in Outlook (or whichever email app the computer uses), with the reference in the subject. Type your question and send it. The booking is marked **Info requested** so the team can see it is waiting on the booker.

The status buttons further down change the status without sending any email.

## How the admin page works

**Choosing a school.** The buttons along the top of the admin page show one school's bookings at a time, or all of them. Each button shows how many new bookings that school has waiting. The page remembers the last school chosen on that computer. Each school also has its own link for its catering team to bookmark:

| School | Link |
| --- | --- |
| Babington | `/admin?site=ba` |
| Heatherbrook | `/admin?site=hpa` |
| Lancaster | `/admin?site=la` |
| South Wigston | `/admin?site=swhs` |
| Woodstock | `/admin?site=wpa` |
| Central Team | `/admin?site=ct` |
| All schools | `/admin?site=all` |

Put the site address in front, for example `https://lwlat-hospitality.netlify.app/admin?site=swhs`. The spreadsheet download, the printed list and **Add a booking** all follow the school you have chosen.

- **Needs a reply** shows new requests. The number on the tab is how many are waiting.
- **Upcoming** shows bookings from today onwards, grouped by day, leaving out declined and cancelled ones.
- Select a booking to see everything about it, change its status, add private notes for the team, or email the person who booked.
- **Download spreadsheet** saves the bookings you are looking at as a CSV file that opens in Excel.
- **Print list** prints the bookings you are looking at as a kitchen sheet.
- **Print order**, at the top of each booking, prints that one order on a single A4 page for the kitchen: the reference, date and time, any allergies in a heavy box, the order as a checklist with tick boxes, handover details, notes, and lines for prepared by, checked by and handed over. Unsaved Catering Team notes are included.

The site does not send emails by itself. The Catering Team confirms each booking by email using the **Email** button on the booking.

## Data protection

The form collects staff names, work email addresses and phone numbers, and dietary or allergy details given as quantities. The form asks people not to name individuals in the dietary box.

- Bookings stay in Netlify's storage until the Catering Team deletes them. Agree how long to keep them, for example to the end of the term after the event, and delete old bookings on that schedule.
- The booking form is open, so anyone with the link can send a request. A hidden spam trap catches most automated junk, and the Catering Team can decline or delete anything that is not genuine.
- Only people with the Catering admin role can see or change bookings, after signing in with Microsoft. The website receives their name and work email from Microsoft, and nothing else. Each booking records who last changed it, and who added it if the Catering Team entered it.
- When someone leaves the Catering Team, ask IT to remove their Catering admin role.
- If the form will ever be used to collect information about individual learners, such as named allergies for a trip, it needs sign-off from the trust's Data Protection Officer first.
