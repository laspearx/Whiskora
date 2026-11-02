// node --test supabase/tests/business_profile_form_unit.test.mts   (node ≥ 22.18 strips the types)
// Edit-form state from a stored business row: 0 / null / '' must replace the previous values (no truthy checks).
import { test } from "node:test";
import assert from "node:assert/strict";
import { profileRowToForm, parseSpecies } from "../../web/lib/businessProfileForm.ts";

test("lat / lng 0 are kept as 0, not dropped", () => {
  const f = profileRowToForm({ shop_name: "A", lat: 0, lng: 0 }, "shop_name");
  assert.equal(f.lat, 0);
  assert.equal(f.lng, 0);
});

test("lat / lng null (or missing) become null so an old pin does not survive a reload", () => {
  assert.deepEqual([profileRowToForm({ lat: null, lng: null }, "shop_name").lat, profileRowToForm({}, "shop_name").lng], [null, null]);
});

test("numeric strings and non-finite values", () => {
  const f = profileRowToForm({ lat: "13.75", lng: "abc" }, "farm_name");
  assert.equal(f.lat, 13.75);
  assert.equal(f.lng, null);
  assert.equal(profileRowToForm({ lat: Number.NaN }, "farm_name").lat, null);
});

test("text fields: null / '' become '', 0 stays '0'", () => {
  const f = profileRowToForm({ service_name: null, owner_name: "", phone: 0, bio: undefined, category: "grooming", province: "x" }, "service_name");
  assert.deepEqual([f.name, f.owner_name, f.phone, f.bio, f.category, f.addr.province, f.addr.road], ["", "", "0", "", "grooming", "x", ""]);
});

test("species: comma list, array, empty and legacy JSON-ish text", () => {
  assert.deepEqual(parseSpecies("dog,cat"), ["dog", "cat"]);
  assert.deepEqual(parseSpecies(["dog", "", 3]), ["dog"]);
  assert.deepEqual(parseSpecies(""), []);
  assert.deepEqual(parseSpecies(null), []);
  assert.deepEqual(parseSpecies('["dog","cat"]'), ["dog", "cat"]);
  assert.deepEqual(parseSpecies("{dog,cat}"), ["dog", "cat"]);
  assert.deepEqual(profileRowToForm({ supported_species: null }, "shop_name").species, []);   // an emptied list clears the old one
});
