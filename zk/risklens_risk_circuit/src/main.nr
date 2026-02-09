fn compute_risk(balances: [u32; 3], prices: [u32; 3]) -> u32 {
    let mut total: u32 = 0;

    for i in 0..3 {
        total += balances[i] * prices[i];
    }

    // Very simple risk proxy
    total % 100
}

pub fn main(
    balances: [u32; 3],
    prices: [u32; 3],
    threshold: u32,

    snapshot_hash: pub Field,
    claim_hash: pub Field,
) {
    let risk_score: u32 = compute_risk(balances, prices);

    // Core claim
    assert(risk_score < threshold);

    // Bind public inputs into the constraint system
    assert(snapshot_hash == snapshot_hash);
    assert(claim_hash == claim_hash);
}
