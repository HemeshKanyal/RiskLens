fn compute_risk(balances: [u32; 3], prices: [u32; 3]) -> u32 {
    let mut total: u32 = 0;

    for i in 0..3 {
        total += balances[i] * prices[i];
    }

    total % 100
}

fn main(
    snapshot_hash: pub Field,
    claim_hash: pub Field,

    balances: [u32; 3],
    prices: [u32; 3],
    threshold: u32
) {

    let risk_score = compute_risk(balances, prices);

    // Risk condition
    assert(risk_score < threshold);

    // Bind public inputs so optimizer doesn't remove them
    assert(snapshot_hash != 0);
    assert(claim_hash != 0);
}