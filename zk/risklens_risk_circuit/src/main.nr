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
    pub snapshot_hash: Field,
    pub claim_hash: Field,
) {
    let risk_score: u32 = {
        let mut total: u32 = 0;
        for i in 0..3 {
            total += balances[i] * prices[i];
        }
        total % 100
    };

    // Core claim
    assert(risk_score < threshold);

    // Bind hashes to proof
    snapshot_hash.assert_is_less_than(2u128.pow(128));
    claim_hash.assert_is_less_than(2u128.pow(128));
}
