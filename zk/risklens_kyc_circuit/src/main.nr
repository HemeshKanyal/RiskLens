// RiskLens identity attestation.
//
// Proves, without revealing the details, that the holder of a commitment:
//   - is at least 18 on `today`
//   - is not from a restricted country code
// and that the commitment really is a hash of those (salted) details.
//
// Private inputs never leave the user's browser. The server only sees the
// public values (`today` and the returned commitment) and the proof.
//
// Dates are YYYYMMDD integers: someone born on `dob` is at least 18 on
// `today` exactly when today - dob >= 180000 (e.g. 20261001 - 20081001).

global MIN_AGE_YYYYMMDD: u32 = 180000;
global RESTRICTED: [u8; 3] = [1, 2, 3]; // demo restricted list

fn main(
    // Private: the user's details, as field-sized hashes where they're text
    name_hash: Field,
    document_hash: Field,
    dob: u32,
    country_code: u8,
    salt: Field,
    // Public
    today: pub u32,
) -> pub Field {
    assert(dob <= today, "date of birth is in the future");
    assert(today - dob >= MIN_AGE_YYYYMMDD, "under 18");

    for code in RESTRICTED {
        assert(country_code != code, "restricted country");
    }

    // Salted so the commitment can't be matched against guessed details
    std::hash::pedersen_hash([name_hash, document_hash, dob as Field, country_code as Field, salt])
}

#[test]
fn adult_passes_and_commits_to_details() {
    let c = main(11, 22, 20000101, 91, 7, 20261001);
    assert(c == std::hash::pedersen_hash([11, 22, 20000101, 91, 7]));
}

#[test]
fn exactly_eighteen_passes() {
    let _ = main(11, 22, 20081001, 91, 7, 20261001);
}

#[test]
fn different_salt_gives_different_commitment() {
    assert(main(11, 22, 20000101, 91, 7, 20261001) != main(11, 22, 20000101, 91, 8, 20261001));
}

#[test(should_fail_with = "under 18")]
fn one_day_short_fails() {
    let _ = main(11, 22, 20081002, 91, 7, 20261001);
}

#[test(should_fail_with = "restricted country")]
fn restricted_country_fails() {
    let _ = main(11, 22, 20000101, 2, 7, 20261001);
}

#[test(should_fail_with = "date of birth is in the future")]
fn future_birth_fails() {
    let _ = main(11, 22, 20300101, 91, 7, 20261001);
}
