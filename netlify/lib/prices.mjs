// Hospitality price list and order costing.
//
// This file runs on the server only. The booking form never receives these
// prices. The bookings API sends them only to people signed in with the
// Catering admin or Catering finance role.
//
// Prices are per person (or per item), in pounds, taken from the
// "Hospitality Costing" spreadsheet. To change a price, edit it here and
// redeploy. Costings already saved on bookings keep the price they were saved with.

export const PRICE_LIST = [
  // Drinks
  { item: "Tea / Coffee", price: 0.35, group: "Drinks" },
  { item: "Herbal Tea", price: 0.35, group: "Drinks" },
  { item: "Juice Carton", price: 0.55, group: "Drinks" },
  { item: "Water Bottle", price: 0.25, group: "Drinks" },
  { item: "Jug Squash", price: 0.75, group: "Drinks" },
  { item: "Jug Fruit Juice", price: 2.00, group: "Drinks" },
  { item: "Jug Water", price: 0.00, group: "Drinks" },
  { item: "Radnor Fizz", price: 0.45, group: "Drinks" },
  // Snacks and bakery
  { item: "Biscuits", price: 0.25, group: "Snacks and bakery" },
  { item: "Border Biscuits", price: 0.40, group: "Snacks and bakery" },
  { item: "Croissant", price: 0.45, group: "Snacks and bakery" },
  { item: "Pain Au Choc", price: 0.70, group: "Snacks and bakery" },
  { item: "Cake", price: 0.40, group: "Snacks and bakery" },
  { item: "Cookie", price: 0.60, group: "Snacks and bakery" },
  { item: "Crisps", price: 0.40, group: "Snacks and bakery" },
  { item: "Mini Doughnut", price: 0.07, group: "Snacks and bakery" },
  { item: "Doughnuts", price: 0.22, group: "Snacks and bakery" },
  // Fruit
  { item: "Fruit Platter", price: 0.75, group: "Fruit" },
  { item: "Fruit Bowl", price: 0.50, group: "Fruit" },
  // Hot food
  { item: "Bacon Cob", price: 1.25, group: "Hot food" },
  { item: "Sausage Cob", price: 1.25, group: "Hot food" },
  { item: "Vegetarian Cob", price: 1.25, group: "Hot food" },
  // Buffets
  { item: "Basic Buffet (3 item)", price: 3.75, group: "Buffets" },
  { item: "Premium Buffet (5 item)", price: 4.90, group: "Buffets" },
  // Grab bags and boxes
  { item: "Primary Grab Bag", price: 2.60, group: "Grab bags and boxes" },
  { item: "Secondary Grab Bag", price: 2.70, group: "Grab bags and boxes" },
  { item: "Bento Box (Tiffin)", price: 5.24, group: "Grab bags and boxes" },
  { item: "Grab Bag (Tiffin)", price: 6.54, group: "Grab bags and boxes" },
];

const PRICE = new Map(PRICE_LIST.map((p) => [p.item, p.price]));

// How each choice on the booking form turns into a suggested costing.
// "each" is how many of the item per person. A "split" shares the people
// between two items, e.g. half croissants and half pains au chocolat.
// Items with no price on the list come through with no price, for the
// Catering Team to fill in.
const HOSPITALITY_SUGGESTIONS = {
  "Tea, coffee and biscuits": [["Tea / Coffee", 1], ["Biscuits", 1]],
  "Cold drinks and water": [["Juice Carton", 1]],
  "Pastry selection": [["split", "Croissant", "Pain Au Choc"]],
  "Sandwich platters": [["Sandwich platters (not on the price list)", 1]],
  "Small buffet (3 items)": [["Basic Buffet (3 item)", 1]],
  "Large buffet (5 items)": [["Premium Buffet (5 item)", 1]],
  "Cakes and sweet treats": [["Cake", 1]],
  "Fruit bowl": [["Fruit Bowl", 1]],
};

// Every packed lunch on the form is costed as a Grab Bag (Tiffin).
const LUNCH_ITEM = "Grab Bag (Tiffin)";

const pennies = (n) => Math.round(n * 100) / 100;
const line = (item, qty) => ({ item, unit: PRICE.has(item) ? PRICE.get(item) : null, qty });

// Works out a suggested costing for a booking from its form answers.
export function suggestCosting(booking) {
  const lines = [];
  const people = Number(booking.people) || 0;
  if (booking.type === "hospitality") {
    for (const choice of booking.hospitalityItems || []) {
      const rule = HOSPITALITY_SUGGESTIONS[choice];
      if (!rule) continue; // "Other" and anything unknown: the Catering Team adds lines by hand.
      for (const r of rule) {
        if (r[0] === "split") {
          const first = Math.ceil(people / 2);
          if (first) lines.push(line(r[1], first));
          if (people - first) lines.push(line(r[2], people - first));
        } else if (people) {
          lines.push(line(r[0], people * r[1]));
        }
      }
    }
  } else {
    const count = Object.values(booking.lunches || {}).reduce((n, v) => n + (Number(v) || 0), 0);
    if (count) lines.push(line(LUNCH_ITEM, count));
  }
  return finish({ lines, suggested: true });
}

// Adds the line totals and the order total.
export function finish(costing) {
  let total = 0;
  let missing = 0;
  costing.lines = costing.lines.map((l) => {
    if (l.unit === null) { missing++; return { ...l, total: null }; }
    const t = pennies(l.unit * l.qty);
    total += t;
    return { ...l, total: t };
  });
  costing.total = pennies(total);
  costing.missingPrices = missing;
  return costing;
}

// Checks a costing sent from the admin page. Throws a message for the person if it is not valid.
export function cleanCosting(input) {
  if (!input || !Array.isArray(input.lines)) throw new Error("The costing could not be read.");
  if (input.lines.length > 60) throw new Error("A costing can have up to 60 lines.");
  const lines = input.lines.map((l, i) => {
    const item = String(l.item ?? "").trim().slice(0, 120);
    if (!item) throw new Error(`Line ${i + 1} needs an item.`);
    const qty = Number(l.qty);
    if (!Number.isInteger(qty) || qty < 0 || qty > 100000) throw new Error(`Line ${i + 1}: the quantity must be a whole number.`);
    let unit = l.unit === null || l.unit === "" || l.unit === undefined ? null : Number(l.unit);
    if (unit !== null && (!Number.isFinite(unit) || unit < 0 || unit > 10000)) throw new Error(`Line ${i + 1}: the price must be a number of pounds.`);
    if (unit !== null) unit = pennies(unit);
    return { item, unit, qty };
  });
  return finish({ lines, suggested: false });
}
