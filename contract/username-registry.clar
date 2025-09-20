;; Alias Registry - minimal MVP
;; clarity_version = 2

;; ---------- Errors ----------
(define-constant ERR-TAKEN       u100)
(define-constant ERR-NOT-OWNER   u403)
(define-constant ERR-NOT-FOUND   u404)
(define-constant ERR-SHORT       u410)
(define-constant ERR-LONG        u411)

;; ---------- Limits ----------
(define-constant MIN-LEN u3)
(define-constant MAX-LEN u32)

;; name -> { owner, target }
(define-map aliases
  { name: (buff 32) }
  { owner: principal, target: principal }
)

;; length helpers
(define-read-only (len-ok (name (buff 32)))
  (let ((l (len name)))
    (and (>= l MIN-LEN) (<= l MAX-LEN))
  )
)

;; Public: register a new alias
(define-public (register (name (buff 32)) (target principal))
  (begin
    (asserts! (>= (len name) MIN-LEN) (err ERR-SHORT))
    (asserts! (<= (len name) MAX-LEN) (err ERR-LONG))
    (asserts! (is-none (map-get? aliases { name: name })) (err ERR-TAKEN))
    (map-set aliases { name: name } { owner: tx-sender, target: target })
    (ok true)
  )
)

;; Public: update target (owner-only)
(define-public (update (name (buff 32)) (target principal))
  (let ((rec (map-get? aliases { name: name })))
    (match rec
      r (if (is-eq (get owner r) tx-sender)
            (begin
              (map-set aliases { name: name } { owner: (get owner r), target: target })
              (ok true)
            )
            (err ERR-NOT-OWNER)
        )
      (err ERR-NOT-FOUND)
    )
  )
)

;; Read-only: get full record
(define-read-only (resolve (name (buff 32)))
  (map-get? aliases { name: name })
)

;; Read-only: get only target
(define-read-only (resolve-target (name (buff 32)))
  (let ((rec (map-get? aliases { name: name })))
    (match rec r (some (get target r)) none)
  )
)
;; --- Optional helper: read owner
(define-read-only (owner-of (name (buff 32)))
  (let ((rec (map-get? aliases { name: name })))
    (match rec r (some (get owner r)) none)
  )
)

;; --- change owner's adress
(define-public (transfer (name (buff 32)) (to principal))
  (let ((rec (map-get? aliases { name: name })))
    (match rec r
      (begin
        (asserts! (is-eq (get owner r) tx-sender) (err ERR-NOT-OWNER))
        (map-set aliases { name: name } { owner: to, target: (get target r) })
        (ok true)
      )
      (err ERR-NOT-FOUND)
    )
  )
)

;; --- Events for index
(define-read-only (exists (name (buff 32)))
  (is-some (map-get? aliases { name: name }))
)

;; --- Pay on chain: tx-sender -> alias target
(define-public (pay (name (buff 32)) (amount uint))
  (let ((rec (map-get? aliases { name: name })))
    (match rec r
      (begin
        (print {event: "pay", name: name, from: tx-sender, to: (get target r), amount: amount})
        (stx-transfer? amount tx-sender (get target r))
      )
      (err ERR-NOT-FOUND)
    )
  )
)

;; --- Direct pay to address (for wallet-to-wallet transfers)
(define-public (pay-direct (recipient principal) (amount uint))
  (begin
    (print {event: "pay-direct", from: tx-sender, to: recipient, amount: amount})
    (stx-transfer? amount tx-sender recipient)
  )
)
