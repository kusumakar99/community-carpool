# 🚗 Community CarPool — Admin Guide

Welcome! This guide will help you set up and manage a carpool community for your society, apartment complex, or WhatsApp group.

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Create Your Community](#-create-your-community)
3. [Extract WhatsApp Group Phone Numbers](#-extract-whatsapp-group-phone-numbers)
4. [Pre-Approve Members](#-pre-approve-members)
5. [Share the Invite Link](#-share-the-invite-link)
6. [Manage Join Requests](#-manage-join-requests)
7. [Manage Members & Admins](#-manage-members--admins)
8. [Creating & Managing Trips](#-creating--managing-trips)
9. [Tips & Best Practices](#-tips--best-practices)
10. [Install on Phone](#-install-on-phone)

---

## 🚀 Getting Started

### Step 1: Register on the App

1. Open the app: **https://community-carpool-app.azurewebsites.net**
2. Click **Register**
3. Fill in your details:
   - Email address
   - Phone number (with country code, e.g., +91 9876543210)
   - Username
   - Password
   - Gender and Age
4. You'll receive an **OTP on your email** — enter it to complete registration
5. Login with your email and password

---

## 🏘️ Create Your Community

1. After logging in, click **Communities** in the navigation bar
2. Click **"Create Community"**
3. Enter:
   - **Name**: e.g., "Serene County Residents" or "Gachibowli Commuters"
   - **Description**: e.g., "Carpool community for Serene County, Telecom Nagar, Hyderabad"
4. Click **Create**
5. You'll get a **unique invite code** (e.g., `T556WG`) and an **invite link**

> ✅ You are now the **admin** of this community. You can add more admins later.

---

## 📱 Extract WhatsApp Group Phone Numbers

Before sharing the invite link, you can pre-approve your WhatsApp group members' phone numbers. This way, they'll be **automatically approved** when they join.

### Method 1: Browser Extension (Recommended — 2 minutes)

1. Open **WhatsApp Web** → https://web.whatsapp.com
2. Scan QR code with your phone to log in
3. Install a browser extension:
   - **Chrome**: [WA Group Number Exporter](https://chromewebstore.google.com/detail/wa-group-number-exporter/mbmldhpfnohbacbljfnjnmhfmecndfjp)
   - **Edge**: [WA Contacts Extractor](https://microsoftedge.microsoft.com/addons/detail/wa-contacts-extractor-d/elfeipoledgehlogobbdllkkndpphgpg)
4. Open your WhatsApp group chat
5. Click the **extension icon** in the browser toolbar
6. Click **Export** — you'll get a list of all phone numbers
7. Copy the phone numbers — you'll paste them into the app in the next step

### Method 2: Google Form (Social approach — 5 minutes)

1. Create a Google Form with fields: **Name** and **Phone Number**
2. Post in the WhatsApp group:
   > "🚗 We're starting a carpool community! Fill this quick form so I can add you: [form link]"
3. Download responses as CSV
4. Copy the phone numbers column

### Method 3: Manual (Small groups — 5-10 minutes)

1. Open WhatsApp → tap the **group name** at the top
2. Scroll through the **member list**
3. Note down the phone numbers manually

> 💡 **Tip**: You don't HAVE to collect numbers upfront. Members who aren't pre-approved will simply need your manual approval (you'll see their name, phone, gender, and age before approving).

---

## ✅ Pre-Approve Members

1. Go to **Communities** → click your community
2. Scroll to **"📋 Pre-approved Phone Numbers"** section
3. You can add phones two ways:

**One at a time:**
- Type a phone number (e.g., `+919876543210`)
- Click **Add**

**Bulk add (paste from export):**
- Click the **bulk add** text area
- Paste multiple phone numbers, **one per line**:
  ```
  +919876543210
  +919876543211
  +919876543212
  +919876543213
  ```
- Click **Add All**

> ✅ Users with pre-approved phone numbers will be **automatically approved** when they click the invite link and register.

---

## 🔗 Share the Invite Link

1. Go to your **Community page**
2. Find the **invite link** (looks like: `https://community-carpool-app.azurewebsites.net/join/T556WG`)
3. Share it:

**In WhatsApp Group Description:**
> Tap group name → Edit → paste the link in the description

**As a WhatsApp Message:**
> Click the **"Share on WhatsApp"** button on the community page — it opens WhatsApp with a pre-filled message

**Sample message to post in the group:**
> 🚗 **Carpool Community**
>
> We've set up a carpool app for our community! You can offer rides or request to join someone's ride.
>
> 👉 Join here: https://community-carpool-app.azurewebsites.net/join/T556WG
>
> Steps:
> 1. Click the link
> 2. Register with your phone number
> 3. If your number is pre-approved, you're in instantly!
> 4. Otherwise, I'll approve you within a few hours.

---

## ⏳ Manage Join Requests

When someone joins whose phone number is NOT pre-approved, they go into a **pending** queue.

1. Go to **Communities** → your community
2. Look for **"⏳ Pending Approvals"** section
3. For each pending member, you'll see:
   - 👤 Username
   - 📞 Phone number
   - 👤 Gender
   - 🎂 Age
4. Click **✅ Approve** if you recognize them from the WhatsApp group
5. Click **❌ Reject** if you don't

> 💡 **Tip**: Compare the phone number with your WhatsApp group member list to verify they're genuine.

---

## 👥 Manage Members & Admins

### View Members
- Go to your community page → **Members** section shows all active members

### Add Co-Admins
You don't have to manage everything alone!
1. Find a trusted member in the list
2. Click **"⬆ Make Admin"** next to their name
3. They can now approve members, manage phones, and create trips

### Demote Admin
1. Click **"⬇ Remove Admin"** next to an admin's name
2. They become a regular member again
3. Note: You can't demote yourself, and at least one admin must remain

### Remove a Member
1. Click **"✕ Remove"** next to a member's name
2. They'll lose access to the community's trips

### Rotate Invite Code
If the invite code gets shared outside your WhatsApp group:
1. Click **"🔄 Regenerate Code"** on the community page
2. A new code is generated — the old link stops working
3. Share the new link in your WhatsApp group

---

## 🚗 Creating & Managing Trips

### Offer a Ride (as Driver)

1. Click **"Create Trip"** in the navigation
2. Choose **Simple mode** (recommended) or **Map mode**:

**Simple Mode:**
- Type origin: e.g., "Serene County, Telecom Nagar"
- Type destination: e.g., "Rajiv Gandhi International Airport"
- Set the price per seat in ₹
- Select your community (so only members see it)

**Map Mode:**
- Search for locations on the map
- Click the map to select exact points
- Price auto-calculates based on distance (₹2/km)

3. Set departure date/time and number of available seats
4. Click **"Create Trip"**

### Manage Ride Requests

When someone requests to join your trip:
1. Go to **My Trips** → find the trip
2. You'll see join requests with the requester's **name, gender, and age**
3. **Phone number** is hidden until you accept
4. Click **✅ Accept** or **❌ Reject**
5. After accepting, both you and the rider can see each other's phone numbers

### Start Journey

1. Go to your trip → click **"🚀 Start Journey"**
2. Status changes to **IN PROGRESS**
3. Riders can now see your phone number to call you

### Complete Trip

1. After reaching the destination, click **"Complete Trip"**
2. ₹ is automatically transferred from each rider to you
3. Trip is marked as **COMPLETED**

---

## 💡 Tips & Best Practices

### For Security
- ✅ **Pre-approve phone numbers** before sharing the invite link
- ✅ **Rotate the invite code** periodically
- ✅ **Add co-admins** so approvals aren't delayed
- ✅ Check pending members' phone numbers against your WhatsApp group

### For Engagement
- 📣 Post a message in the WhatsApp group when a new trip is available
- 🔄 Encourage members to both offer and request rides
- 💬 Use the app's community page as the go-to place for carpool coordination

### For Pricing
- 🏷️ In **Simple mode**, set fair prices (e.g., ₹50-100 for short commutes, ₹200-500 for long distances)
- 📏 In **Map mode**, the app auto-calculates at ₹2/km — adjust if needed
- 💰 Everyone starts with ₹500 balance

---

## 📱 Install on Phone

### Android (PWA — Recommended, no download needed)

1. Open **https://community-carpool-app.azurewebsites.net** in **Chrome**
2. Tap the **⋮ menu** (three dots, top right)
3. Tap **"Install app"** or **"Add to Home screen"**
4. The app icon 🚗 appears on your home screen
5. It works like a native app!

### iPhone (PWA)

1. Open the URL in **Safari**
2. Tap the **Share button** (box with arrow)
3. Tap **"Add to Home Screen"**

> 💡 **Share these install instructions** in your WhatsApp group so everyone installs the app.

---

## ❓ FAQ

**Q: What if someone shares the invite link outside the group?**
> A: If you pre-approved phone numbers, outsiders will be put in the pending queue for your approval. You can also regenerate the invite code anytime.

**Q: Can one person be in multiple communities?**
> A: Yes! A user can join multiple communities (e.g., "Office Commute" and "Society Weekend Trips").

**Q: What if a rider doesn't have enough balance?**
> A: They won't be able to join the trip. Everyone starts with ₹500.

**Q: Can I see who requested a ride before accepting?**
> A: Yes! You'll see their username, gender, and age. Phone number is revealed only after you accept.

**Q: How do I contact the driver/rider?**
> A: After a join request is accepted, both parties can see each other's phone number with a clickable **📞 Call** button.

---

## 🆘 Need Help?

Contact the app administrator or raise an issue at:
https://github.com/kusumakar99/community-carpool/issues

---

Happy carpooling! 🚗💨
