(define-data-var owner principal tx-sender)

(define-constant ERR_UNAUTHORIZED (err u201))
(define-constant ERR_PANIC (err u202))

(define-public (finalize-swap (txid (buff 32)) (preimage (buff 128)))
  (let
    (
      (swap-resp (try! (contract-call? .bridge finalize-swap txid preimage)))
      (swap (try! (contract-call? .bridge get-full-inbound txid)))
      (sats (get sats swap))
      (xbtc (get xbtc swap))
      (fee (- sats xbtc))
      (updated-funds (try! (withdraw-funds fee)))
      (swapper (get swapper-principal swap))
    )
    ;; here, you can do special logic to move funds into a sub-protocol

    ;; refunding fees:
    (try! (as-contract (contract-call? .xbtc transfer fee tx-sender swapper none)))
    (ok swap)
  )
)

;; owner methods

(define-public (register-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18))
    (funds uint)
  )
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge register-supplier public-key inbound-fee outbound-fee outbound-base-fee inbound-base-fee name funds))
  )
)

(define-public (add-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge add-funds amount))
  )
)

(define-public (remove-funds (amount uint))
  (begin
    (try! (validate-owner))
    (as-contract (contract-call? .bridge remove-funds amount))
  )
)

(define-public (update-supplier
    (public-key (buff 33))
    (inbound-fee (optional int))
    (outbound-fee (optional int))
    (outbound-base-fee int)
    (inbound-base-fee int)
    (name (string-ascii 18))
  )
  (begin
    (try! (validate-owner))
    (try! (as-contract (contract-call? .bridge update-supplier-fees inbound-fee outbound-fee outbound-base-fee inbound-base-fee)))
    (try! (as-contract (contract-call? .bridge update-supplier-public-key public-key)))
    (as-contract (contract-call? .bridge update-supplier-name name))
  )
)

(define-public (transfer-owner (new-owner principal))
  (begin
    (try! (validate-owner))
    (var-set owner new-owner)
    (ok new-owner)
  )
)

;; internal

(define-private (withdraw-funds (amount uint))
  (as-contract (contract-call? .bridge remove-funds amount))
)

;; helpers

(define-read-only (validate-owner)
  (if (is-eq contract-caller (get-owner))
    (ok true)
    ERR_UNAUTHORIZED
  )
)

(define-read-only (get-owner) (var-get owner))