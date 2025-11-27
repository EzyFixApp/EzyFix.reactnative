# Technician Wallet – Frontend Usage Guideline

## 1. Bank Directory

Endpoint này là nguồn duy nhất để build dropdown và đảm bảo payload bank info (bankCode/bin) chuẩn cho các endpoint tạo/duyệt payout.

| Field | Value |
| --- | --- |
| Name | Wallet banks |
| Method | GET |
| Endpoint URL | `/api/v1/wallet/banks` |
| Description | Lists VietQR-supporting banks for payout: FE dùng để build dropdown, backend dùng `bin`/`code` để validate/generate QR payload. |
| Auth Required | Yes (any authenticated role) |

**Response**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Bank directory loaded",
  "data": [
    {
      "key": "VCB",
      "code": "VCB",
      "shortName": "Vietcombank",
      "name": "Joint Stock Commercial Bank for Foreign Trade of Vietnam",
      "bin": "970436",
      "vietQrStatus": "TRANSFER_SUPPORTED",
      "lookupSupported": true,
      "swiftCode": "BFTVVNVX"
    }
  ]
}
```

> Lưu ý: danh sách lấy từ VietQRHelper (NuGet), có `vietQrStatus` = `TRANSFER_SUPPORTED|RECEIVE_ONLY`. FE nên chỉ cho phép chọn bank có `TRANSFER_SUPPORTED` để giảm rủi ro fail.

## 2. Wallet Summary

| Field | Value |
| --- | --- |
| Name | Wallet summary |
| Method | GET |
| Endpoint URL | `/api/v1/wallet/summary` |
| Description | Returns balance, hold, available balance, debt flag, and the latest 5 transactions. |
| Auth Required | Yes (Technician) |

**Response (200 OK)**  
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Wallet summary loaded",
  "data": {
    "walletAccountId": "guid",
    "balance": 1200000.0,
    "holdAmount": 300000.0,
    "availableBalance": 900000.0,
    "hasDebt": false,
    "recentTransactions": [
      {
        "transactionId": "guid",
        "walletAccountId": "guid",
        "type": "CREDIT",
        "reason": "EARNING",
        "amount": 150000.0,
        "referenceType": "PAYMENT",
        "referenceId": "guid",
        "appointmentId": "guid",
        "paymentId": "guid",
        "note": "Net after commission 45,000",
        "createdAt": "2025-11-25T18:10:00Z"
      }
    ]
  }
}
```

## 3. Wallet Transactions

| Field | Value |
| --- | --- |
| Name | Wallet transactions (paged) |
| Method | GET |
| Endpoint URL | `/api/v1/wallet/transactions` |
| Description | Lists wallet transactions with filters. |
| Auth Required | Yes (Technician) |

**Query Parameters**
| Parameter | Type | Required | Default | Example | Description |
| --- | --- | --- | --- | --- | --- |
| `page` | int | ✖ | 1 | `?page=1` | Page index (1-based) |
| `pageSize` | int | ✖ | 10 | `?pageSize=20` | Items per page (max 100) |
| `reason` | enum | ✖ | - | `?reason=EARNING` | Filter by reason (EARNING/COMMISSION/WITHDRAWAL/ADJUSTMENT) |
| `type` | enum | ✖ | - | `?type=DEBIT` | Filter by CREDIT/DEBIT |
| `from` | datetime | ✖ | - | `?from=2025-11-01` | CreatedAt lower bound (ISO) |
| `to` | datetime | ✖ | - | `?to=2025-11-30` | CreatedAt upper bound (ISO) |

**Response Pagination Format** (standard `PagingResponse`) with `items` = `WalletTransactionResponse` and `meta` = pagination info.  
**Response (200 OK)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Wallet transactions loaded",
  "data": {
    "items": [
      {
        "transactionId": "c5b99394-5e11-42d1-8df4-42fcd7f3b4b5",
        "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
        "type": "CREDIT",
        "reason": "EARNING",
        "amount": 520000,
        "referenceType": "PAYMENT",
        "referenceId": "6f1a1d3f-1d61-4b63-8c57-15af7e0fbb3a",
        "appointmentId": "1b041114-e2f9-47bb-a8d1-37d70bf7bc54",
        "paymentId": "6f1a1d3f-1d61-4b63-8c57-15af7e0fbb3a",
        "note": "Escrow released for completed appointment",
        "createdAt": "2025-10-25T04:12:00Z"
      }
    ],
    "meta": {
      "total_pages": 3,
      "total_items": 22,
      "current_page": 1,
      "page_size": 10
    }
  }
}
```

## 4. Technician Payout Requests (list)

| Field | Value |
| --- | --- |
| Name | Technician payout list |
| Method | GET |
| Endpoint URL | `/api/v1/wallet/payouts` |
| Description | Lists payout requests của chính technician (paged). |
| Auth Required | Yes (Technician) |

**Query Parameters**: `status?`, `page`, `pageSize` (same pagination envelope as transactions). Items are `WalletPayoutResponse`.  
**Response (200 OK)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payouts loaded",
  "data": {
    "items": [
      {
        "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
        "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
        "amount": 800000,
        "holdAmount": 320000,
        "status": "PENDING",
        "receiverName": "Nguyen Hoang Anh",
        "receiverAccount": "9704158601234567",
        "bankCode": "TPB",
        "note": "Weekly withdrawal request",
        "requestedAt": "2025-10-26T06:30:00Z",
        "approvedAt": null,
        "paidAt": null,
        "rejectedAt": null,
        "processedAt": null,
        "failureReason": null,
        "processedBy": null,
        "vietQrPayload": "00020101021126220010A0000007270123000697042301234567896304A13F",
        "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABmJLR0QA/wD/AP+gvaeT",
        "renderQrEnabled": true
      }
    ],
    "meta": {
      "total_pages": 2,
      "total_items": 12,
      "current_page": 1,
      "page_size": 10
    }
  }
}
```

## 5. Create Payout Request

| Field | Value |
| --- | --- |
| Name | Create payout |
| Method | POST |
| Endpoint URL | `/api/v1/wallet/payouts` |
| Description | Technician requests withdrawal; amount must not exceed available balance (after holds). |
| Auth Required | Yes (Technician) |

**Request Body**
```json
{
  "amount": 500000,
  "receiverName": "Nguyen Van A",
  "receiverAccount": "0123456789",
  "bankCode": "970436",
  "note": "Rút thu nhập tuần này"
}
```

**Response** → `WalletPayoutResponse` with status `PENDING`, hold applied when `Payouts:EnableHold=true`.  
> Ghi chú: `bankCode` là BIN (6-digit) hoặc mã code lấy trực tiếp từ `/wallet/banks` để khớp VietQR.

**Response (200 OK)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payout request created",
  "data": {
    "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
    "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
    "amount": 800000,
    "holdAmount": 320000,
    "status": "PENDING",
    "receiverName": "Nguyen Hoang Anh",
    "receiverAccount": "9704158601234567",
    "bankCode": "TPB",
    "note": "Weekly withdrawal request",
    "requestedAt": "2025-10-26T06:30:00Z",
    "approvedAt": null,
    "paidAt": null,
    "rejectedAt": null,
    "processedAt": null,
    "failureReason": null,
    "processedBy": null,
    "vietQrPayload": null,
    "vietQrImageBase64": null,
    "renderQrEnabled": true
  }
}
```

## 6. Admin – List Payouts

| Field | Value |
| --- | --- |
| Name | Admin payout list |
| Method | GET |
| Endpoint URL | `/api/v1/admin/payouts` |
| Description | Paginated payouts for admin review. |
| Auth Required | Yes (Admin) |

**Query Parameters**
| Parameter | Type | Required | Default | Example |
| --- | --- | --- | --- | --- |
| `status` | enum | ✖ | - | `?status=PENDING` |
| `technicianId` | guid | ✖ | - | `?technicianId=...` |
| `page` | int | ✖ | 1 | `?page=1` |
| `pageSize` | int | ✖ | 10 | `?pageSize=20` |

**Response** → `PagingResponse<AdminWalletPayoutResponse>` with technician info, wallet balance, available balance, QR payload/image (image null if rendering disabled).  
**Response (200 OK)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payouts fetched",
  "data": {
    "items": [
      {
        "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
        "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
        "technicianId": "0b2c53d2-16e9-4214-8121-04e05e225b7b",
        "technicianName": "Nguyen Hoang Anh",
        "technicianEmail": "hoang.anh.tech@ezyfix.vn",
        "amount": 800000,
        "holdAmount": 320000,
        "status": "PENDING",
        "receiverName": "Nguyen Hoang Anh",
        "receiverAccount": "9704158601234567",
        "bankCode": "TPB",
        "requestedAt": "2025-10-26T06:30:00Z",
        "approvedAt": null,
        "paidAt": null,
        "vietQrPayload": null,
        "vietQrImageBase64": null,
        "renderQrEnabled": false
      }
    ],
    "meta": {
      "total_pages": 1,
      "total_items": 1,
      "current_page": 1,
      "page_size": 10
    }
  }
}
```

## 7. Admin – Approve Payout

| Field | Value |
| --- | --- |
| Name | Approve payout |
| Method | POST |
| Endpoint URL | `/api/v1/admin/payouts/{id}/approve` |
| Description | Locks payout, generates VietQR payload (image optional). |
| Auth Required | Yes (Admin) |

**Request Body**
```json
{
  "purpose": "Rút ví EZYFIX"
}
```

**Response** → `WalletPayoutResponse` với `status=APPROVED`, `vietQrPayload`, `vietQrImageBase64` (có thể null nếu render lỗi), `holdAmount=amount` khi hold bật.

**Response (sample)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payout approved",
  "data": {
    "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
    "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
    "amount": 800000,
    "holdAmount": 320000,
    "status": "APPROVED",
    "receiverName": "Nguyen Hoang Anh",
    "receiverAccount": "9704158601234567",
    "bankCode": "TPB",
    "note": "Weekly withdrawal request",
    "requestedAt": "2025-10-26T06:30:00Z",
    "approvedAt": "2025-10-26T06:35:00Z",
    "paidAt": null,
    "rejectedAt": null,
    "processedAt": "2025-10-26T06:35:00Z",
    "failureReason": null,
    "processedBy": "2b0e1c5b-7098-45da-814a-28b7a9ba62b6",
    "vietQrPayload": "00020101021126220010A0000007270123000697042301234567896304A13F",
    "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABmJLR0QA/wD/AP+gvaeT",
    "renderQrEnabled": true
  }
}
```

## 8. Admin – Mark Paid

| Field | Value |
| --- | --- |
| Name | Mark payout paid |
| Method | POST |
| Endpoint URL | `/api/v1/admin/payouts/{id}/mark-paid` |
| Description | Marks payout as PAID, creates wallet debit, releases hold. |
| Auth Required | Yes (Admin) |

**Request Body (optional proof)**  
```json
{
  "proofNote": "Đã chuyển lúc 10:30",
  "referenceNumber": "FT123456"
}
```

**Response** → `WalletPayoutResponse` with `status=PAID`.

**Response (sample)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payout marked as paid",
  "data": {
    "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
    "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
    "amount": 800000,
    "holdAmount": 0,
    "status": "PAID",
    "receiverName": "Nguyen Hoang Anh",
    "receiverAccount": "9704158601234567",
    "bankCode": "TPB",
    "note": "Đã chuyển lúc 10:30",
    "requestedAt": "2025-10-26T06:30:00Z",
    "approvedAt": "2025-10-26T06:35:00Z",
    "paidAt": "2025-10-26T07:00:00Z",
    "rejectedAt": null,
    "processedAt": "2025-10-26T07:00:00Z",
    "failureReason": null,
    "processedBy": "2b0e1c5b-7098-45da-814a-28b7a9ba62b6",
    "vietQrPayload": "00020101021126220010A0000007270123000697042301234567896304A13F",
    "vietQrImageBase64": "iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAABmJLR0QA/wD/AP+gvaeT",
    "renderQrEnabled": true
  }
}
```

## 9. Admin – Reject Payout

| Field | Value |
| --- | --- |
| Name | Reject payout |
| Method | POST |
| Endpoint URL | `/api/v1/admin/payouts/{id}/reject` |
| Description | Rejects payout from PENDING/APPROVED, releases hold. |
| Auth Required | Yes (Admin) |

**Request Body**
```json
{
  "reason": "Thông tin tài khoản không hợp lệ"
}
```

**Response** → `WalletPayoutResponse` with `status=REJECTED`, `holdAmount=0`.

**Response (sample)**
```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Payout rejected",
  "data": {
    "payoutRequestId": "b7a6b9f6-6e4f-4d65-9f6a-63a8c7e31f42",
    "walletAccountId": "2d2e9b46-4f5d-4af1-94f6-15fb7c1f98c5",
    "amount": 800000,
    "holdAmount": 0,
    "status": "REJECTED",
    "receiverName": "Nguyen Hoang Anh",
    "receiverAccount": "9704158601234567",
    "bankCode": "TPB",
    "note": "Thông tin tài khoản không hợp lệ",
    "requestedAt": "2025-10-26T06:30:00Z",
    "approvedAt": null,
    "paidAt": null,
    "rejectedAt": "2025-10-26T06:50:00Z",
    "processedAt": "2025-10-26T06:50:00Z",
    "failureReason": null,
    "processedBy": "2b0e1c5b-7098-45da-814a-28b7a9ba62b6",
    "vietQrPayload": null,
    "vietQrImageBase64": null,
    "renderQrEnabled": false
  }
}
```
