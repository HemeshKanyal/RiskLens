fn is_blacklisted(country: u8) -> bool {
    let r1 = country == 1;
    let r2 = country == 2;
    let r3 = country == 3;

    r1 | r2 | r3
}

fn main(
    age: u8,
    country_code: u8,
    kyc_status: u8,
    identity_commitment: Field,

    claim_hash: pub Field,
    identity_commitment_hash: pub Field
) {

    // Age >= 18
    assert(age >= 18);

    // KYC verified
    assert(kyc_status == 1);

    // Country not blacklisted
    let blacklisted = is_blacklisted(country_code);
    assert(!blacklisted);

    // Commitment check
    assert(identity_commitment_hash == identity_commitment);

    // Claim relation
    assert(claim_hash == identity_commitment);
}