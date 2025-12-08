---
name: "Phase 3: Profile Settings Improvements"
overview: ""
todos:
  - id: ffd2a30d-d2a4-4ffb-9874-4bf4bdf58ef3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 02d7caae-7631-4793-96b3-3574b75c6bad
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 55a06a4e-c8f7-43c5-b730-30c33faf14f7
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4900bc65-66cf-41e5-a77c-3425fcd7c080
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f8b7a707-e640-4ce1-823f-ecfcf70420b0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: e1e689ae-f38e-4bea-872e-56c519f49ccf
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: cd47b705-9eb8-4eca-ab99-924cb87b8742
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 90b22d2a-bf84-4a0d-8e41-174e885cbfee
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 5217951b-ad24-4e4b-9854-ae3a1540f75a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: e1701652-a955-47e7-bfe4-16e036ca0861
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 27f6098d-861a-4e51-87ea-dd9c743cc133
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 4ac66090-5290-400f-9fd2-cbe50a12701a
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 6e0c2002-24b9-4d73-858f-5396d1ed84d8
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 7bde0463-04a7-465d-8c1b-2e9760a011c0
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 63187e97-2800-4df7-a5bd-c0afb2b2d08b
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1bfaf8dc-e147-41bd-a3f6-90270d376a2c
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: d145af2b-dfe6-4ec0-81a7-8d43f57cfe98
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: eb717275-bb94-4ad1-8bd5-2512c15db568
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4a21f70a-1dca-4483-b3e8-40045623c3ae
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3067dd6a-fab5-4d29-bd15-c69ba6f6f765
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: bbd56aeb-e829-4883-b307-a7f5f0b9d24a
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 7007d2c4-c801-4ee4-93f6-455b2b6471c1
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 9336d3b2-ad60-4078-b2a7-593bf6cd7fc1
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9e30979d-86c1-4185-a917-06f1480d41f9
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 6d956a40-8bd4-44e2-82f0-f729ccd2383a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: dac742b2-4d0e-41b5-8267-1bcb6b9288c6
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 08bc6f79-98d7-4eca-aba1-2392ea8a7155
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0d876a80-bccc-40f9-ac6a-e40e854a1a25
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: e49d669c-323a-4ab9-898e-967b403da1a3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: fa5b8bf6-cec8-4e46-b099-3d6b62cb6825
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 480f046b-c6c4-4b2e-aa6a-7d8393e163e6
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: f0cc9b0d-aaec-4c56-9b3f-80b219886561
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 7eebdcda-65b0-4b93-b012-d9695752d9a8
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: ef010e7e-c2f1-4cfd-ac42-3512b225c905
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 1c18fd5f-0544-4f9a-b96f-7c681f3e431b
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 3f1a8473-cc5b-425c-aced-3333843b4138
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: f758a547-5f89-444b-b61f-9c7cebca292b
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a94678ed-afc0-4782-a1be-91bb0b8c3988
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 7e515e2c-2d94-4d78-9e58-daa026755298
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 8e052f4a-0a59-48ba-84f7-e6080edb99b5
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 366d1887-5b72-4cac-bb7e-2195eed7a73e
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 25667054-548e-4058-aa4c-7234ae929281
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: d78df90a-f9c1-4d90-a5a9-4051afd3ebed
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 4ece6e71-48e4-4a9d-bb30-485020ad1613
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 5734a6bf-2c6a-4ec6-a614-e1960b2a33a0
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 8c397831-7161-4fb1-afbf-79fe54dcced7
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 99720278-da8e-46e5-8a4d-56096a2c1920
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c8d591ed-1628-4809-af65-fba476e1276a
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: d0485021-1476-4254-a6c6-e96eaaab3b44
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 84c56fec-8d7e-48f7-969b-d5787fe4cd00
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: c2fa5626-1c51-4b56-9972-de4aa949a382
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3115c33a-715a-40b1-a0e4-0231b5f40f40
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: de3aa9a7-cdc4-456d-bfc0-4da4e82b373d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 4fa65c5f-b708-4310-8170-b9db6d3150a8
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 75258c80-ea17-4ca3-a894-a668240c7218
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 8498966c-50f4-4884-97d8-3e12e9ecd59f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 34b61fca-8f8f-48ce-882c-557d2741fbb2
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 7967d500-5c84-4ceb-9dbb-10f10c1b13f0
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 03788d48-a10c-464b-a6ff-809c6e732cdf
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 628da2d4-1d21-4355-ab82-cdbecc70cd91
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 9eaf1b4d-af2a-4e9e-ad02-8f2007dc71d3
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: bdfa0aa5-6e2d-4c8b-a2ef-2d3c000139dc
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9ffebb57-c635-4a1e-a45c-e06d32574968
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 06e63028-b95c-4e07-a485-9d61e1313c65
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3722fa48-8acf-4b52-ae22-8fc6e8eab674
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a5d2ab24-3571-4e13-9ebb-0a3dc73401e7
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 633c5f64-823e-4fc4-b46d-c619f16b8046
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2a6c14bd-85c6-4377-a0c0-6c5bbcc9d416
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 537e1b29-19c6-422f-9762-d58d26dca656
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: e4c5d34c-2c1a-4a95-a662-70732a81df4b
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 12ecf2eb-c986-438a-87d4-ad0009393f58
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 3984e0ed-682b-452b-9995-685363bf3751
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: df1df5bb-6b21-44b1-8f19-df2b12cfaf17
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 0d3ed3f2-f82f-405e-9308-1ca1bc97a67d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 127a486c-2bdf-46d0-ab11-427ecf591401
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 80443850-0dcd-4192-92af-194c27293904
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 0e58e51b-1eb5-4041-a8e4-ac43b080fbd8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 964adaa8-da18-4cf9-b725-15a554832275
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 4eb2fa82-34fd-4c84-963f-fd766c6fb599
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: e769ceaa-81e1-4e6d-a9c0-c587151002b9
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: e60c4e77-a42a-427e-8407-ca80c05319da
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 00372a08-fc33-40ef-b147-10ec6c99d3aa
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 91536b34-df6c-4cfd-aa7b-e38544db325a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 467e90e1-b977-4bc1-83d8-81afb8bef79d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2e072919-2441-4d04-9cb9-ed96312bac49
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f669b1b5-312d-4dde-b0db-375fb539d329
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c37fe27c-3ddf-4639-b76c-6084c95a7e79
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 6131bb86-27db-4c92-a6c8-9572346b2ebe
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: dca30f2e-9165-483a-ada4-1d56c45816df
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: dd896656-e67b-416c-a0d1-938341cc12d4
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 69691a53-280f-4013-b292-dc5eb7d22463
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2860e2b7-8048-4bef-9ae5-7b306a7d512e
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: eb422869-3e59-4017-a5cc-10567359b42a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 73530c91-ab43-407e-813f-809e61e860fd
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f8903ec2-6802-47ad-bc30-f846edb03fe7
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aad8372-78ed-459c-8d8f-a73d5cc51adf
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 6ede6fc4-79ed-4d82-b3b7-f1ef0e41b24a
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 558d2964-3346-4263-b70f-3b77f0a9875b
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: bb1bc6c3-de99-4f68-b3c6-b2b35ef77584
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e8fed1ae-470a-4ba1-94fb-5edfba8c4544
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: e2b9b794-e90f-4b46-a47e-9621e74bacb4
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 02437ebe-796e-406e-86e8-11df6a8ecd28
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 3eee5165-2f0e-482f-85f6-74e9685673b3
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: b69cfea5-ab72-4f82-bfb7-613561cfde01
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 07bb2850-8a36-4f45-ad79-c386f5e987f8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a1043b26-4129-47e7-a69a-29b5b0f30a3b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: eb011032-2e15-4b1c-b24f-af93af325a22
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 42c0ca34-dbd1-4c1d-bfd7-e726183fdf8e
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d4d82322-11f0-4038-a3b5-323b292a36af
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 4b23d700-77e4-4594-bd2c-5f865fe2d527
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 76b6727f-c44b-491c-9360-f3828ef89d8c
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: b722f13b-5400-4cd0-a309-a06ad3b3ddc5
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c0d943b6-0c42-488f-a07f-05e08343cf79
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 81a3f4d8-e6d8-41aa-b7d2-37cc1939b755
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 323ca49e-0e4c-4911-8647-96c290726c04
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 8b33c0a8-6272-49da-b49d-892e0797b203
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a472ecd1-307a-4194-97ae-81a8b102c8c0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 62d47416-c65e-409c-a2e2-55db0dd56291
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: f1e6ecb5-cafc-4034-97cf-16ebea1a857f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 10d87ae4-a682-43e3-9066-fd2ca0aec409
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3558a479-e350-4a1c-b20a-7d31ffd744ee
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 94a94b3f-7b88-439b-a031-e13bdcbe3b66
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9f466cb9-2515-40b2-a0d1-8986c5cf47a1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2d8d85f4-1bdd-4e74-ae0d-f7fb052ae8da
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: bdc4ba38-81f1-476b-b149-1546f01f805c
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 93fbc31a-18ca-4ab6-8ebd-6560fabab713
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 3f82a0e3-bfa8-453f-97e0-6b612af2b6da
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 8f9210ba-8db8-4e5c-bec7-d3024c8c33ed
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 33a88606-f0ed-41e9-8835-cd8439a27b0d
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 82517e65-bc34-4ba0-9aa9-8ddd6147345d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: caef1759-f792-4e53-b7fc-8ad03cef09d5
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f8bb3419-5fb4-41e2-b9b2-b4d33d8153e5
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: ccc25a55-e14a-4941-a060-8d0b07744dc1
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 37607bd4-b06c-4b43-90da-49314e11fa35
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: a9c3dffd-2daf-4a53-9928-766772deab16
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: d55804e4-b221-416f-89c0-3cfebb633e23
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d37ded6c-525e-4c56-a4a1-ab153be645d5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 839006c6-8520-438f-8582-1b3cb235d5cf
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 05e621f5-6e2d-4720-964b-57dd1e6147c5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0b5e1f72-d48a-49a2-b8c3-c56d5d5adebc
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: db3d651c-e6c5-4aed-84f4-b28790e46e9a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 36039292-9fc2-4740-a59d-c37a8cfe72c9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 156702dc-2791-4fe9-8b8d-72611b8963b0
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 8ac25bc3-a3c7-4421-884d-c59839f3c493
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b5e4c45e-6ce1-4fd8-bdd3-4a142f95d144
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 30ed4704-46d1-40e7-8cce-fecf8576ba81
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 2b6701fc-7a67-4f79-874d-5dfcfac3cb19
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d75bd2b3-f0d0-4b63-b086-87f3b62b30f3
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 458bd92d-b053-4c00-909d-d5fd94fac1e5
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c36b282b-5541-48f5-84ae-5ad6295a7307
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 14ab899e-76d5-488d-8b1f-3c9b308063c8
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 5b7a6325-6c58-4aee-8a05-af9e1b8cb5c9
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 3f77a923-e8de-4174-a660-59ca9a820d6c
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: eebfe976-4ac9-4e2a-8f34-92c13d51a73d
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: a408e049-1554-4647-9eba-89298cc32907
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1089d419-844d-4f62-bbc0-41b58e8835c0
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 39887b05-455c-40be-96e9-d92cad0f3139
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 42764630-f74b-4dcb-bbfd-6ca72da71b37
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9cb3f5bf-e65c-4741-aeaf-2353e95d31bd
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7dee969a-5f0d-47eb-b387-0a79b6db3bc3
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 5dcab3cc-5a3f-411b-ad6a-3cdd11a73b79
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: e77d2e8a-0b9e-478e-9d95-bfac01634bd5
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8827a8c9-dc5d-417e-82d2-c4366a53d7b6
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9a1ae0a9-ea5b-4ae8-b0d7-3513fa0609b4
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: db8ac839-adc0-4de5-93ba-baeff13ae34b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2a8614f1-518b-4d12-a450-4707e1069852
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 150eabc3-7d5b-4530-8069-eef3d58bef3f
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9beb3418-413e-456e-aa19-96e7d7995652
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 922d55e5-001b-4046-af61-0c0cbd0e0815
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5ba4afa5-58fc-41ad-918a-48a0da3bb22e
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3fde0ea9-d908-4290-bd16-945c3c667e36
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 1208d232-1387-43fe-9e61-d801722fe67f
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b1ebb977-4cbb-4a24-9dc3-4f7b5b98f550
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8102d69a-a053-491e-89ec-c03d7f23e0e2
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 8277149f-c5b0-467e-82de-41a06195351b
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 4967b749-389b-4412-a3f8-84f2de422036
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3d12ee5a-df85-4272-aeac-d324e81d6d2c
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a0247fd0-71c8-4f42-aa54-ca397510a201
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4b851309-8f90-43c2-b1be-53b43eeab334
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7d077333-8311-413b-82fe-ee28983f3452
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: f1938722-3ce1-4e39-9441-3354c04d1a67
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: db3d4486-c71c-462a-89e0-8a6d526edfa0
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: b2213bf6-9c01-4479-8c0f-196b7fcd93fb
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: fdf9deac-9966-4407-bd89-6cd659c85961
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: fcd1ec3c-f0a3-4e1e-8cc5-87296368f3f2
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: fa153009-1f63-4d50-a43f-075f3eb9eacc
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: cdbca7fe-b361-4d1a-b6d8-a2aa64b3fc42
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f850df88-49b5-4767-a308-8d276a1545b9
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: eb7b04d5-b8d2-4667-a532-893ddadf6165
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 8564a0d2-1fe6-4a5b-94e4-edc366b8de97
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: d3892916-5ef7-4051-b874-4cded51d13bc
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: ccd10527-2d92-4782-90cd-64143816fa6c
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: ae26f2c2-ae45-494f-a930-9d8b3f5fde2b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 40712b48-3b9e-4fa5-a8c1-6fad72109ca2
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 075c6d8b-8105-4af2-b4ca-7fda1484013e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: d6eee245-9333-4930-99d7-9caab9952c1a
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 12292d9b-79ba-4c20-84d8-156f2edc9bf9
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: bee0f775-d595-4288-90dd-3db50da45ca9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 03576e10-330b-4483-bd83-ca2463abad98
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 813b43d2-e3d9-4081-86bb-dfa40534c141
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 86a1be3a-83e4-487a-9c82-30be84a68451
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: db1bc7db-b579-40d4-986e-78992617c5d9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 741c2323-89e7-4bb1-86cb-b23059bcd04f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 924b84b4-bf94-45e0-ac1e-aca7a1160f57
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: d4f8c31d-a439-4192-a4a9-acdaa3baeb0a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 6e193e95-2393-494e-b49e-e4a2fc4862fe
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 840e3568-a1f6-4e04-aa55-6803d14aa6f9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 5929d0a8-32af-4823-ae57-74db363f2f05
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: ac80353c-3496-4563-b936-94517bf44d2f
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 1e4526b9-d6c3-4e07-96ff-4ce3dc0478f5
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: cc8703ca-2cd7-4e8b-a074-7a08f6cd545e
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1fd762e7-0c78-462a-bb80-40c0a21f6c47
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: be19fb7d-086b-4c67-8c18-ebf7c8fda2ba
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: db152822-435c-4ea0-b08a-84f6a612c722
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4ceedcdc-1320-4e8f-9bac-b253b54a4175
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 673ffe65-2470-4d17-81d5-4b9a99818fdc
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4ec30093-f15d-437b-9fc0-2572cd3cb9b9
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 2acc2248-c2d0-44f3-ab7f-69e7d94b28ca
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 31cba363-7891-4497-905a-8b359f959664
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 7fefa5d4-f8e5-4b44-a3eb-57a6dd685a58
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: bef44d67-08a8-4b0e-9209-3e5db8ddcd7d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: e5b6a581-aa1f-4628-95ca-bc01ecd56c73
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 1857cefe-9920-48c0-8616-9882989247ab
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 1ab873b0-a08b-4b96-a9a0-f49fce8f224a
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 524aef16-b6d4-4f0b-ae43-f0cf156be830
    content: Create /api/public/stats and /api/public/testimonials endpoints (backend)
    status: completed
  - id: 813e5496-f4ed-4395-bec2-7f9d32a1b250
    content: Create features/landing/services/landing.service.ts for API calls
    status: completed
  - id: a40036ec-7fac-44b9-80c5-bea89a76ead5
    content: Replace hardcoded values with API calls using React Query in LandingPage
    status: completed
  - id: e0cf21d4-28d9-45fd-8a3f-6ee31e369d25
    content: Fix footer links to actual routes
    status: completed
  - id: 3bceaef2-cd9a-44bb-987f-4ff233034fbb
    content: Clear error state on input change in LoginPage
    status: completed
  - id: c40ae15b-2161-4fe1-9328-b8d49e05d709
    content: Add input sanitization utility and use in LoginPage
    status: completed
  - id: 5dcef4f6-5b0b-4641-8926-661a8b34d589
    content: Add custom validation feedback with inline errors in LoginPage
    status: completed
  - id: 15ed9f11-96c7-4769-b402-41d77c526e0c
    content: Add 'Remember Me' checkbox in LoginPage
    status: completed
  - id: a657630a-9ba1-46ef-a0ec-e39821fad97f
    content: Add password visibility toggle in LoginPage
    status: completed
  - id: b2d201d9-dcc4-4828-ae4a-4d2b42f87b64
    content: Integrate PAN verification in Step 2 using PANVerificationInline component
    status: pending
  - id: ee97e5fb-12c4-4828-bab7-a8499692d58a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 88f23e2b-b7cc-462f-93c7-0cac6c200c26
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 1bd9f6b9-a0f0-448c-a1fe-2ba1ec52cf93
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 9f3acaf5-d8bb-42d9-8268-b19d828ab10c
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: ecd5022d-b7bd-4f8a-b712-fc384f3f22e8
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: f5e31348-38b7-4b0d-a39d-bf3472469ec1
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: f03584fe-6959-4868-a77b-67f1664667f2
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 1261db92-7cb5-484f-9e49-e579546c35f5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3b2766ba-0fd4-4ac1-8552-a625c62f35d3
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 910a8a99-7634-4b86-9b03-d7382af46344
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: efab2ace-ecfd-4586-aeb5-ed1c0b15c8eb
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 681e7bcf-e742-4063-b684-290549a770d2
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: d5f6c4dd-95a9-4f8d-8326-a39b6cfc831a
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 1016f0f9-055a-478c-b6f9-6c785804eca4
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 6b8d8737-6d08-48bc-ac52-2f6bf4d9c40e
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e4e9e9ec-2e46-4280-93aa-8a32740c32f0
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 2e09c1ba-dfee-4c77-ba16-6911437be2df
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 06d57182-7643-4396-a7b6-e78cab7f3220
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0b6d5761-671e-4d7f-9ad2-45ef7c9e819d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 9b6e11b0-9dbd-424c-b710-05db4001ea79
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: e92ee7f8-4c2a-4cd9-bb61-faa0252defb6
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b9f9e1f3-29b9-456e-b2a3-8d9497270088
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: da8c4832-8a92-4682-8ddd-0ca9e1409884
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 17827e22-56aa-407f-8bc6-7470ce76e680
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 35d6cee3-6f6e-4203-9122-55cb3e71697d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2e39d83f-82af-4ad4-80a6-ea33176559c8
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 873d40f6-42a5-4d75-919c-be2ee311a379
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: a77be564-2b56-438f-bfe0-0eda2717fc19
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: ce8de14a-17c8-4701-b516-f8e44ce4f191
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5e7d6201-5303-44a1-bffe-66d0b2954e67
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: bb36b919-38a1-4fca-9853-f957bdabf242
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 5e0874f6-9488-4f8a-8d37-c8195dba12f3
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 24dd8d59-32f6-4852-b0a1-adf1034e8b6e
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 89319d02-0216-4cf6-a81d-76ead757fd16
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: fed66d58-5d55-4e5b-8ec3-10cd9229d3fb
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2d686010-7ac5-4447-b4f8-8e5ddfa19f86
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 85de0d02-f932-404c-8c87-aea5cabc3d63
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 939e2752-fed7-432b-9449-75076eea8d1e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4acef3a1-cf96-4653-a96d-6aae6508e76c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 1ea35976-995c-45e3-ad9c-dbf538096974
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: cef29139-222e-4251-9f33-e85f5aa639c4
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 0c130c82-efbf-4f31-9a9e-7fcbdfbee522
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 12e78d8f-b23a-45c6-a9fe-7090c538e6ea
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 9aca75a0-da81-41e2-a08c-0103e77e7096
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 30f62fc9-faf3-4812-9757-8aeb33c80bec
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 90162f87-ba25-415e-8d6b-1c9d48bd8c75
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f45d9c2f-e92a-4b57-8870-6f9453aca357
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fdb35658-4131-4cd5-8675-269c86fa8b56
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 62bf3c7f-c946-4e91-82ad-29bdac43d0a5
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f5e66201-e9dd-4573-83c1-49611740185f
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 796b39fd-a1c7-4975-a80c-9958694b7c30
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 7c8616b2-352d-4589-bf2e-13a8cc887448
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: aebd5b40-3115-4522-8bf8-b30868a8a88c
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 8da72edd-39ad-4d3b-a434-92b4a41f6778
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: e34403c2-a010-4e1b-ba56-3a541ff79af5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 177bb159-7061-4f23-b1d0-85707d59979c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: e9f0eeef-daa3-49ab-9657-715a24e2dac5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: ff6c8809-2852-4a10-9ed1-385d20e2a899
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 6d7c24f1-b185-4c91-80d3-c0358599a4ba
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 58065b3e-f177-40b9-8d41-cab40679f5cb
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a10f7445-ef2d-477e-bb71-a9678af59dea
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 4f23a17c-02a9-4202-8b0d-ac27b11d0010
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: d5fb266e-3fd2-4cba-a06f-8cd8f2ae18c1
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: bd8b5da6-fd99-47f9-ae8d-f0451219c78c
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2fa95a58-f837-4c01-a2a5-750bfcae86b5
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 88884880-ab7d-4967-8fdd-abac9341c930
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 939b6726-9ed2-4d6b-b72b-4c0c47fdfc5f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 57787e32-6385-4d99-b809-38ff00dfc0ff
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 51fed4dc-9489-4de3-aa5c-1a8a87219638
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 61cf1430-7136-4bde-a4f8-ce21725036b5
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 8df7e372-02b8-4d60-a5af-eae8d82c8ca4
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 6c913a7c-f1d1-4277-832d-5c89ef6d5e86
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: d3c7164e-fc51-46e4-ae2f-f6b20b152644
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 3af67bea-bcbe-4b25-aba6-ccd1731c621e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 889c973a-9425-4b0d-a8ff-a9a85d18726f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 42a9af98-0832-45d8-93f0-4a36a60afec0
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 04f8091e-ed26-4ef7-ac76-a997ca83d5a2
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 523c25a7-ef70-45bf-84d7-faa1f1dc1c90
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 527fb3bb-95fe-4683-b432-a7613a851480
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 8096a5da-fdef-44a2-a975-ad459d899c54
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 4ddd621c-c1a3-44ae-b875-9c2887be8226
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: f7801517-3f14-46de-9133-9a806261bdf7
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 0929a3b3-1b16-4f0a-9590-d8f141292a15
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5f372b60-d610-4235-bab8-45dbdb5de37b
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 36874d37-4b10-412d-8c10-45a075d3dfd3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 502a666c-b692-49b0-9437-71af1b8cde05
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 32120274-6f3e-4117-9e9c-7416946b6d38
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: c3410a4d-00b2-4f19-91c6-c9caef6a5573
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a45892e8-6209-4b4c-9bd3-b5005a3dc904
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 1eaf14c4-c8a7-4b66-b248-e7dd3700be4c
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 012e53ce-9292-4b60-9cd1-e43c903b1e86
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8f3b1ae7-6a79-4a4b-96af-a18c679099b5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 1a62f813-20d1-46f7-9d84-d468e557880e
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c59daf2d-1eb1-4be1-9050-75c64d3842c3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 6b16ec4f-9c9c-4baa-9bf2-800acf481d34
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7ce2c2a9-39e9-4b40-b695-44e9ecc541b6
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 64213cf7-e3b6-4891-9c4f-64fefe14e892
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 385303c6-d358-4e67-8fed-cab495c2f904
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: d18aba64-6d1d-433c-8cad-c767c082fac7
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: a186ecec-54cb-4b10-a6de-82e8f1b32c7d
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 8a51d3ae-28ee-45f9-9657-84b88e4c1ac7
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 0645b885-3651-4d82-9e1b-2fcf2a4b6086
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: d0aee986-4ad3-43ef-aeae-bd3fcbdffbf9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 8d13502b-9ae2-4395-af27-c88dcfabe27d
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: f1b25576-8e4e-4e8a-804b-113f7f9de13d
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 27f8a867-fa6b-4798-8791-1562f21f48a7
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 47fc4fe6-3f12-46a9-abcd-ad28c3ad166e
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 61890d70-d9c2-44a1-a281-010015d8c914
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2b486928-795a-47e8-905a-cead3baa80e2
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 27a593e2-ba37-4d41-9a25-126debf9233b
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 31d1d3a2-d22a-4bfa-b38f-573d951a0f27
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 86cf493a-60ee-424d-84c7-64c7c4bfcd88
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f058b887-76cd-43c3-9f66-80c6ebbe40f6
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: bbdb9d0e-267b-4f64-ad39-8ea6a3656a2b
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: cdc27869-eed4-45dd-a867-f915b7100d6f
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 9543fe14-4d18-40da-ac67-3febb866dc61
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 9c048ab6-9077-4c3b-be64-8feb67f4808d
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: c9fb8194-6037-4ad0-8c63-ee5b0940e783
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: c365a729-316d-402b-89c5-dd176047a66f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 833f3f8a-99af-4f50-82e3-4a01d3a5148a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 8edb73bf-7ff2-41a7-a2b9-4e8196d52287
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: bd86c4f6-5941-4ad4-8158-da255c0b5404
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: ec47bcfd-df7e-43ae-8d12-54afa5cc47e1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 76a7adbb-6984-4a2d-9ecb-ca9c1f55afa1
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 7fd7f0c8-a2e9-4a49-8811-8fd3df8900d3
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 7987c074-e54d-4994-acaf-f7b58f75f194
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 91d6524c-d5d5-47be-b354-396a45fd1e3a
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: d134cc7f-9585-4c97-b562-d1368d1121aa
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 06937932-4559-4921-ac8a-e25e121f0c27
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 065f7945-473d-4ba9-9c23-1dd438a7ad1a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 386cf37f-4e2e-4862-adfb-491a152545c1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aa451f6-ecd6-422b-a27d-10c6827312cd
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 0b18c850-a36d-48ee-988c-31f527b1b6e2
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 989dbbe1-c0db-4e7d-9629-046b48354c3e
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 3e2940c5-3b2a-4e4d-8874-30440306c77b
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3bf4bea6-c3f3-48e7-a556-9c98e7cf8cac
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 0af2e6ba-9575-4db4-bb1b-778fafa47524
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 7c8c3323-eced-4626-bfe7-b7a4e823f196
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c78f0400-a84d-411a-94f0-f474b72fc0c3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: b210fffd-4633-44ef-b851-b3b0e77c1aac
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: d4be68ad-a25b-4344-9d2e-064fcac4b1e6
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 62733ce6-b36c-4376-908f-f6b8ed0d9d76
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f630474b-01e2-4dda-89da-55e83d4a6d90
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 15d955f6-a5ae-4e78-af13-401e8477485f
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: c61db1a2-ed6b-437d-8d8c-e849e09e2f28
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 2cc7b23b-28b8-4ef2-885b-acfd5728a1ec
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 1416de9e-01d5-4f86-bc84-c9b53e355792
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 95f662a4-1af3-4a98-b3d0-71b6a1acaa4b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 5fa7c560-ec53-47d4-84ff-ce1c9567e2ca
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 40729aa0-b6a8-4228-b2ae-dd6c9ded7a0e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4c4ff155-4176-4290-bec7-ac5829d42913
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 96e4507c-ffe7-4b34-bbfa-ae5dd4ded72d
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 59309414-8113-4582-a135-36ab6ba3d445
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: f57886da-9234-4c1e-a5b4-d424b7f76790
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 90e6a810-8c35-4e33-baf0-6ff552462c73
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e7a14eaa-fcae-42c8-9566-0200bc2d8d7f
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 431853ce-3436-4c66-8f87-ad85e657a5e3
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 1061c628-2a3b-40f1-9736-8e49d485ae8d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9764b18d-9e0a-4642-8a7b-ab4b300e5e54
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 670d0940-3c37-48f1-a742-fead5fbf317d
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 74a2178f-6b8e-42ef-8147-369289cdbe0b
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f722ceb8-fd59-46ef-89d6-89b7cf1c3dee
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8e63664a-e9d7-46f9-a72b-e38a445474d9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 62652cbf-4af0-4273-9cae-1473c1574484
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8ac4201a-ee67-41e7-8c63-15b3b8482b6a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: c79f3e6e-c34c-4a29-b3f7-34505f39880d
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: aa640a60-7cb2-4aeb-8b92-e0757df32da4
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: a4934bd9-faa6-470e-954b-5186b861a90e
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f4cf459f-b6cf-4bcb-868c-c0357adbbf66
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 94e0c881-c574-4525-b02e-ee0930b8ab8c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3fb2c4d0-65eb-44a7-8e5c-4c8d32460d54
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: bd0df62e-cf76-4f4a-b593-58b651c50e78
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 1e09f429-5a20-4e15-9d05-b88d6f675c20
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: a374ed0b-929d-4f82-8ffc-61fdf0bd3291
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: c1a77564-0e90-4e19-a723-ff553e4c7640
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 249d7fd1-d7ee-41ed-8e03-902601fb9586
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 79ddea50-d900-4ce5-b582-886889f45904
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: f67b2076-266a-428e-b6c8-c275891e9a9e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 8c93c13d-8dc6-42ae-9280-353ffc56bb73
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fbfc3a2b-1b7f-43ba-bc8e-7b40ef0ce6b4
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: e9703e8b-4d26-42b7-b420-4ed749400be9
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: ab83a080-6e3a-445c-8684-de4767f997df
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 5fde6e91-ed7e-427f-a62d-0f7db2fc0332
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: bcef86cb-b10f-43c4-a201-5398c5dbafbb
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 8a62a414-892e-4325-809d-1461b9582486
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 964dff9e-bb88-44a1-a27b-b1c14fc938a5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: cf1f83e7-2300-4772-8417-e50f8be6676d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aaf79ee-a716-470e-9431-df2c8192d7d5
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 03bc1fd7-90a6-408c-9210-3adc4b6a0915
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 60be9df7-b2d5-4faf-a76c-c836301f85c0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 17896f0f-9f59-45c6-b905-8ad4239f6d71
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3eedb5da-a8f6-4637-bb44-a378d5414c6f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8beb01e1-0a70-43d0-bfd3-0fc34789c7db
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2dad3a9e-40a6-49ac-8642-5f855f667841
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 105f9326-5da8-4116-8ebd-8d65480c0214
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 47d2099d-b8b0-425a-a5cd-391b879ece64
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: a0639ca1-09c6-49b2-8874-45cb58995829
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: aa75e20c-825c-4cc2-b8bb-c159e9258bb9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 441c14de-32a9-4dda-97bf-0e1bf87df6e7
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: df41c7e3-5fa1-4c84-aef4-78e666c2bac8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 59d513fb-668d-4bfb-b56b-9e238ad04a5b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 63758635-cf75-444d-97f4-dd7543ade9ea
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: affab443-ec66-42c0-868a-b5e9eecf79e6
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d9cc0162-b872-4507-8b96-4eefd9d87fc4
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: af9e18af-ad54-4487-bdd0-88b20632361c
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 04fcf9eb-7feb-47e8-8f84-583ebccdb068
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 60b8629d-0260-46fc-8262-c54d6181cff7
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fadeabbf-37a0-4c6c-8ed9-175ba4e338ca
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: a5083537-a9e1-416a-b456-dcce886db392
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 2c7ae013-5b39-41d7-9d86-be29571b9295
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 540b8ceb-3204-4c25-8f4e-cd413fe68e59
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: df059642-3745-4de8-9e36-eaffa0b57d75
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: e35bb2f6-2228-4b93-a6c0-487e0e4fa191
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 8e15f194-a31d-477f-b6ba-caeba317bb10
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: aab5cd4f-d9d5-43b0-8747-a15cb027f4bb
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 05b328a2-0f2f-41d9-b292-a2e44c85473c
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4159d2fa-9632-4f05-a64e-f064fdd339a9
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: baa5281f-72b6-49e8-87f3-ee8806697b9b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 799e96a9-3456-431a-ad2a-f879b4ce6da9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 4612f300-e9e8-428c-8420-aa4136d7b4ef
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 0c2413e6-b06b-49b3-a259-4180b61db9b7
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3fa7e0b1-5918-4597-a79f-48a7faa602b2
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: f650e6f7-acea-4d93-9b35-bb135b418a1d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 29d1926a-c09d-41ce-bf3f-0ccb0cdb9291
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
---

---
name: "Phase 3: Profile Settings Improvements"
overview: ""
todos:
  - id: ffd2a30d-d2a4-4ffb-9874-4bf4bdf58ef3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 02d7caae-7631-4793-96b3-3574b75c6bad
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 55a06a4e-c8f7-43c5-b730-30c33faf14f7
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4900bc65-66cf-41e5-a77c-3425fcd7c080
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f8b7a707-e640-4ce1-823f-ecfcf70420b0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: e1e689ae-f38e-4bea-872e-56c519f49ccf
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: cd47b705-9eb8-4eca-ab99-924cb87b8742
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 90b22d2a-bf84-4a0d-8e41-174e885cbfee
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 5217951b-ad24-4e4b-9854-ae3a1540f75a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: e1701652-a955-47e7-bfe4-16e036ca0861
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 27f6098d-861a-4e51-87ea-dd9c743cc133
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 4ac66090-5290-400f-9fd2-cbe50a12701a
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 6e0c2002-24b9-4d73-858f-5396d1ed84d8
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 7bde0463-04a7-465d-8c1b-2e9760a011c0
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 63187e97-2800-4df7-a5bd-c0afb2b2d08b
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1bfaf8dc-e147-41bd-a3f6-90270d376a2c
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: d145af2b-dfe6-4ec0-81a7-8d43f57cfe98
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: eb717275-bb94-4ad1-8bd5-2512c15db568
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4a21f70a-1dca-4483-b3e8-40045623c3ae
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3067dd6a-fab5-4d29-bd15-c69ba6f6f765
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: bbd56aeb-e829-4883-b307-a7f5f0b9d24a
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 7007d2c4-c801-4ee4-93f6-455b2b6471c1
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 9336d3b2-ad60-4078-b2a7-593bf6cd7fc1
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9e30979d-86c1-4185-a917-06f1480d41f9
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 6d956a40-8bd4-44e2-82f0-f729ccd2383a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: dac742b2-4d0e-41b5-8267-1bcb6b9288c6
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 08bc6f79-98d7-4eca-aba1-2392ea8a7155
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0d876a80-bccc-40f9-ac6a-e40e854a1a25
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: e49d669c-323a-4ab9-898e-967b403da1a3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: fa5b8bf6-cec8-4e46-b099-3d6b62cb6825
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 480f046b-c6c4-4b2e-aa6a-7d8393e163e6
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: f0cc9b0d-aaec-4c56-9b3f-80b219886561
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 7eebdcda-65b0-4b93-b012-d9695752d9a8
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: ef010e7e-c2f1-4cfd-ac42-3512b225c905
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 1c18fd5f-0544-4f9a-b96f-7c681f3e431b
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 3f1a8473-cc5b-425c-aced-3333843b4138
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: f758a547-5f89-444b-b61f-9c7cebca292b
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a94678ed-afc0-4782-a1be-91bb0b8c3988
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 7e515e2c-2d94-4d78-9e58-daa026755298
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 8e052f4a-0a59-48ba-84f7-e6080edb99b5
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 366d1887-5b72-4cac-bb7e-2195eed7a73e
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 25667054-548e-4058-aa4c-7234ae929281
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: d78df90a-f9c1-4d90-a5a9-4051afd3ebed
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 4ece6e71-48e4-4a9d-bb30-485020ad1613
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 5734a6bf-2c6a-4ec6-a614-e1960b2a33a0
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 8c397831-7161-4fb1-afbf-79fe54dcced7
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 99720278-da8e-46e5-8a4d-56096a2c1920
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c8d591ed-1628-4809-af65-fba476e1276a
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: d0485021-1476-4254-a6c6-e96eaaab3b44
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 84c56fec-8d7e-48f7-969b-d5787fe4cd00
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: c2fa5626-1c51-4b56-9972-de4aa949a382
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3115c33a-715a-40b1-a0e4-0231b5f40f40
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: de3aa9a7-cdc4-456d-bfc0-4da4e82b373d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 4fa65c5f-b708-4310-8170-b9db6d3150a8
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 75258c80-ea17-4ca3-a894-a668240c7218
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 8498966c-50f4-4884-97d8-3e12e9ecd59f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 34b61fca-8f8f-48ce-882c-557d2741fbb2
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 7967d500-5c84-4ceb-9dbb-10f10c1b13f0
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 03788d48-a10c-464b-a6ff-809c6e732cdf
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 628da2d4-1d21-4355-ab82-cdbecc70cd91
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 9eaf1b4d-af2a-4e9e-ad02-8f2007dc71d3
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: bdfa0aa5-6e2d-4c8b-a2ef-2d3c000139dc
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9ffebb57-c635-4a1e-a45c-e06d32574968
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 06e63028-b95c-4e07-a485-9d61e1313c65
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3722fa48-8acf-4b52-ae22-8fc6e8eab674
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a5d2ab24-3571-4e13-9ebb-0a3dc73401e7
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 633c5f64-823e-4fc4-b46d-c619f16b8046
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2a6c14bd-85c6-4377-a0c0-6c5bbcc9d416
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 537e1b29-19c6-422f-9762-d58d26dca656
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: e4c5d34c-2c1a-4a95-a662-70732a81df4b
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 12ecf2eb-c986-438a-87d4-ad0009393f58
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 3984e0ed-682b-452b-9995-685363bf3751
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: df1df5bb-6b21-44b1-8f19-df2b12cfaf17
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 0d3ed3f2-f82f-405e-9308-1ca1bc97a67d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 127a486c-2bdf-46d0-ab11-427ecf591401
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 80443850-0dcd-4192-92af-194c27293904
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 0e58e51b-1eb5-4041-a8e4-ac43b080fbd8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 964adaa8-da18-4cf9-b725-15a554832275
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 4eb2fa82-34fd-4c84-963f-fd766c6fb599
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: e769ceaa-81e1-4e6d-a9c0-c587151002b9
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: e60c4e77-a42a-427e-8407-ca80c05319da
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 00372a08-fc33-40ef-b147-10ec6c99d3aa
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 91536b34-df6c-4cfd-aa7b-e38544db325a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 467e90e1-b977-4bc1-83d8-81afb8bef79d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2e072919-2441-4d04-9cb9-ed96312bac49
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f669b1b5-312d-4dde-b0db-375fb539d329
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c37fe27c-3ddf-4639-b76c-6084c95a7e79
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 6131bb86-27db-4c92-a6c8-9572346b2ebe
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: dca30f2e-9165-483a-ada4-1d56c45816df
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: dd896656-e67b-416c-a0d1-938341cc12d4
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 69691a53-280f-4013-b292-dc5eb7d22463
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2860e2b7-8048-4bef-9ae5-7b306a7d512e
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: eb422869-3e59-4017-a5cc-10567359b42a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 73530c91-ab43-407e-813f-809e61e860fd
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f8903ec2-6802-47ad-bc30-f846edb03fe7
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aad8372-78ed-459c-8d8f-a73d5cc51adf
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 6ede6fc4-79ed-4d82-b3b7-f1ef0e41b24a
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 558d2964-3346-4263-b70f-3b77f0a9875b
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: bb1bc6c3-de99-4f68-b3c6-b2b35ef77584
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e8fed1ae-470a-4ba1-94fb-5edfba8c4544
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: e2b9b794-e90f-4b46-a47e-9621e74bacb4
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 02437ebe-796e-406e-86e8-11df6a8ecd28
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 3eee5165-2f0e-482f-85f6-74e9685673b3
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: b69cfea5-ab72-4f82-bfb7-613561cfde01
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 07bb2850-8a36-4f45-ad79-c386f5e987f8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a1043b26-4129-47e7-a69a-29b5b0f30a3b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: eb011032-2e15-4b1c-b24f-af93af325a22
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 42c0ca34-dbd1-4c1d-bfd7-e726183fdf8e
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d4d82322-11f0-4038-a3b5-323b292a36af
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 4b23d700-77e4-4594-bd2c-5f865fe2d527
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 76b6727f-c44b-491c-9360-f3828ef89d8c
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: b722f13b-5400-4cd0-a309-a06ad3b3ddc5
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: c0d943b6-0c42-488f-a07f-05e08343cf79
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 81a3f4d8-e6d8-41aa-b7d2-37cc1939b755
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 323ca49e-0e4c-4911-8647-96c290726c04
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 8b33c0a8-6272-49da-b49d-892e0797b203
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a472ecd1-307a-4194-97ae-81a8b102c8c0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 62d47416-c65e-409c-a2e2-55db0dd56291
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: f1e6ecb5-cafc-4034-97cf-16ebea1a857f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 10d87ae4-a682-43e3-9066-fd2ca0aec409
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3558a479-e350-4a1c-b20a-7d31ffd744ee
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 94a94b3f-7b88-439b-a031-e13bdcbe3b66
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9f466cb9-2515-40b2-a0d1-8986c5cf47a1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 2d8d85f4-1bdd-4e74-ae0d-f7fb052ae8da
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: bdc4ba38-81f1-476b-b149-1546f01f805c
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 93fbc31a-18ca-4ab6-8ebd-6560fabab713
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 3f82a0e3-bfa8-453f-97e0-6b612af2b6da
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 8f9210ba-8db8-4e5c-bec7-d3024c8c33ed
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 33a88606-f0ed-41e9-8835-cd8439a27b0d
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 82517e65-bc34-4ba0-9aa9-8ddd6147345d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: caef1759-f792-4e53-b7fc-8ad03cef09d5
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f8bb3419-5fb4-41e2-b9b2-b4d33d8153e5
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: ccc25a55-e14a-4941-a060-8d0b07744dc1
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 37607bd4-b06c-4b43-90da-49314e11fa35
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: a9c3dffd-2daf-4a53-9928-766772deab16
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: d55804e4-b221-416f-89c0-3cfebb633e23
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d37ded6c-525e-4c56-a4a1-ab153be645d5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 839006c6-8520-438f-8582-1b3cb235d5cf
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 05e621f5-6e2d-4720-964b-57dd1e6147c5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0b5e1f72-d48a-49a2-b8c3-c56d5d5adebc
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: db3d651c-e6c5-4aed-84f4-b28790e46e9a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 36039292-9fc2-4740-a59d-c37a8cfe72c9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 156702dc-2791-4fe9-8b8d-72611b8963b0
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 8ac25bc3-a3c7-4421-884d-c59839f3c493
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b5e4c45e-6ce1-4fd8-bdd3-4a142f95d144
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 30ed4704-46d1-40e7-8cce-fecf8576ba81
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 2b6701fc-7a67-4f79-874d-5dfcfac3cb19
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d75bd2b3-f0d0-4b63-b086-87f3b62b30f3
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 458bd92d-b053-4c00-909d-d5fd94fac1e5
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c36b282b-5541-48f5-84ae-5ad6295a7307
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 14ab899e-76d5-488d-8b1f-3c9b308063c8
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 5b7a6325-6c58-4aee-8a05-af9e1b8cb5c9
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 3f77a923-e8de-4174-a660-59ca9a820d6c
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: eebfe976-4ac9-4e2a-8f34-92c13d51a73d
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: a408e049-1554-4647-9eba-89298cc32907
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1089d419-844d-4f62-bbc0-41b58e8835c0
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 39887b05-455c-40be-96e9-d92cad0f3139
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 42764630-f74b-4dcb-bbfd-6ca72da71b37
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9cb3f5bf-e65c-4741-aeaf-2353e95d31bd
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7dee969a-5f0d-47eb-b387-0a79b6db3bc3
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 5dcab3cc-5a3f-411b-ad6a-3cdd11a73b79
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: e77d2e8a-0b9e-478e-9d95-bfac01634bd5
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8827a8c9-dc5d-417e-82d2-c4366a53d7b6
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 9a1ae0a9-ea5b-4ae8-b0d7-3513fa0609b4
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: db8ac839-adc0-4de5-93ba-baeff13ae34b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2a8614f1-518b-4d12-a450-4707e1069852
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 150eabc3-7d5b-4530-8069-eef3d58bef3f
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9beb3418-413e-456e-aa19-96e7d7995652
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 922d55e5-001b-4046-af61-0c0cbd0e0815
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5ba4afa5-58fc-41ad-918a-48a0da3bb22e
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3fde0ea9-d908-4290-bd16-945c3c667e36
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 1208d232-1387-43fe-9e61-d801722fe67f
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b1ebb977-4cbb-4a24-9dc3-4f7b5b98f550
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8102d69a-a053-491e-89ec-c03d7f23e0e2
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 8277149f-c5b0-467e-82de-41a06195351b
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 4967b749-389b-4412-a3f8-84f2de422036
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3d12ee5a-df85-4272-aeac-d324e81d6d2c
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: a0247fd0-71c8-4f42-aa54-ca397510a201
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4b851309-8f90-43c2-b1be-53b43eeab334
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7d077333-8311-413b-82fe-ee28983f3452
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: f1938722-3ce1-4e39-9441-3354c04d1a67
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: db3d4486-c71c-462a-89e0-8a6d526edfa0
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: b2213bf6-9c01-4479-8c0f-196b7fcd93fb
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: fdf9deac-9966-4407-bd89-6cd659c85961
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: fcd1ec3c-f0a3-4e1e-8cc5-87296368f3f2
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: fa153009-1f63-4d50-a43f-075f3eb9eacc
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: cdbca7fe-b361-4d1a-b6d8-a2aa64b3fc42
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f850df88-49b5-4767-a308-8d276a1545b9
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: eb7b04d5-b8d2-4667-a532-893ddadf6165
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 8564a0d2-1fe6-4a5b-94e4-edc366b8de97
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: d3892916-5ef7-4051-b874-4cded51d13bc
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: ccd10527-2d92-4782-90cd-64143816fa6c
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: ae26f2c2-ae45-494f-a930-9d8b3f5fde2b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 40712b48-3b9e-4fa5-a8c1-6fad72109ca2
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 075c6d8b-8105-4af2-b4ca-7fda1484013e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: d6eee245-9333-4930-99d7-9caab9952c1a
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 12292d9b-79ba-4c20-84d8-156f2edc9bf9
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: bee0f775-d595-4288-90dd-3db50da45ca9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 03576e10-330b-4483-bd83-ca2463abad98
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 813b43d2-e3d9-4081-86bb-dfa40534c141
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 86a1be3a-83e4-487a-9c82-30be84a68451
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: db1bc7db-b579-40d4-986e-78992617c5d9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 741c2323-89e7-4bb1-86cb-b23059bcd04f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 924b84b4-bf94-45e0-ac1e-aca7a1160f57
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: d4f8c31d-a439-4192-a4a9-acdaa3baeb0a
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 6e193e95-2393-494e-b49e-e4a2fc4862fe
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 840e3568-a1f6-4e04-aa55-6803d14aa6f9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 5929d0a8-32af-4823-ae57-74db363f2f05
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: ac80353c-3496-4563-b936-94517bf44d2f
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 1e4526b9-d6c3-4e07-96ff-4ce3dc0478f5
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: cc8703ca-2cd7-4e8b-a074-7a08f6cd545e
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 1fd762e7-0c78-462a-bb80-40c0a21f6c47
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: be19fb7d-086b-4c67-8c18-ebf7c8fda2ba
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: db152822-435c-4ea0-b08a-84f6a612c722
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4ceedcdc-1320-4e8f-9bac-b253b54a4175
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 673ffe65-2470-4d17-81d5-4b9a99818fdc
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4ec30093-f15d-437b-9fc0-2572cd3cb9b9
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 2acc2248-c2d0-44f3-ab7f-69e7d94b28ca
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 31cba363-7891-4497-905a-8b359f959664
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 7fefa5d4-f8e5-4b44-a3eb-57a6dd685a58
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: bef44d67-08a8-4b0e-9209-3e5db8ddcd7d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: e5b6a581-aa1f-4628-95ca-bc01ecd56c73
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 1857cefe-9920-48c0-8616-9882989247ab
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 1ab873b0-a08b-4b96-a9a0-f49fce8f224a
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 524aef16-b6d4-4f0b-ae43-f0cf156be830
    content: Create /api/public/stats and /api/public/testimonials endpoints (backend)
    status: completed
  - id: 813e5496-f4ed-4395-bec2-7f9d32a1b250
    content: Create features/landing/services/landing.service.ts for API calls
    status: completed
  - id: a40036ec-7fac-44b9-80c5-bea89a76ead5
    content: Replace hardcoded values with API calls using React Query in LandingPage
    status: completed
  - id: e0cf21d4-28d9-45fd-8a3f-6ee31e369d25
    content: Fix footer links to actual routes
    status: completed
  - id: 3bceaef2-cd9a-44bb-987f-4ff233034fbb
    content: Clear error state on input change in LoginPage
    status: completed
  - id: c40ae15b-2161-4fe1-9328-b8d49e05d709
    content: Add input sanitization utility and use in LoginPage
    status: completed
  - id: 5dcef4f6-5b0b-4641-8926-661a8b34d589
    content: Add custom validation feedback with inline errors in LoginPage
    status: completed
  - id: 15ed9f11-96c7-4769-b402-41d77c526e0c
    content: Add 'Remember Me' checkbox in LoginPage
    status: completed
  - id: a657630a-9ba1-46ef-a0ec-e39821fad97f
    content: Add password visibility toggle in LoginPage
    status: completed
  - id: b2d201d9-dcc4-4828-ae4a-4d2b42f87b64
    content: Integrate PAN verification in Step 2 using PANVerificationInline component
    status: pending
  - id: ee97e5fb-12c4-4828-bab7-a8499692d58a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 88f23e2b-b7cc-462f-93c7-0cac6c200c26
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 1bd9f6b9-a0f0-448c-a1fe-2ba1ec52cf93
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 9f3acaf5-d8bb-42d9-8268-b19d828ab10c
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: ecd5022d-b7bd-4f8a-b712-fc384f3f22e8
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: f5e31348-38b7-4b0d-a39d-bf3472469ec1
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: f03584fe-6959-4868-a77b-67f1664667f2
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 1261db92-7cb5-484f-9e49-e579546c35f5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3b2766ba-0fd4-4ac1-8552-a625c62f35d3
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 910a8a99-7634-4b86-9b03-d7382af46344
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: efab2ace-ecfd-4586-aeb5-ed1c0b15c8eb
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 681e7bcf-e742-4063-b684-290549a770d2
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: d5f6c4dd-95a9-4f8d-8326-a39b6cfc831a
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 1016f0f9-055a-478c-b6f9-6c785804eca4
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 6b8d8737-6d08-48bc-ac52-2f6bf4d9c40e
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e4e9e9ec-2e46-4280-93aa-8a32740c32f0
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 2e09c1ba-dfee-4c77-ba16-6911437be2df
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 06d57182-7643-4396-a7b6-e78cab7f3220
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 0b6d5761-671e-4d7f-9ad2-45ef7c9e819d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 9b6e11b0-9dbd-424c-b710-05db4001ea79
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: e92ee7f8-4c2a-4cd9-bb61-faa0252defb6
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: b9f9e1f3-29b9-456e-b2a3-8d9497270088
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: da8c4832-8a92-4682-8ddd-0ca9e1409884
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 17827e22-56aa-407f-8bc6-7470ce76e680
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 35d6cee3-6f6e-4203-9122-55cb3e71697d
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2e39d83f-82af-4ad4-80a6-ea33176559c8
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 873d40f6-42a5-4d75-919c-be2ee311a379
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: a77be564-2b56-438f-bfe0-0eda2717fc19
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: ce8de14a-17c8-4701-b516-f8e44ce4f191
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5e7d6201-5303-44a1-bffe-66d0b2954e67
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: bb36b919-38a1-4fca-9853-f957bdabf242
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 5e0874f6-9488-4f8a-8d37-c8195dba12f3
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 24dd8d59-32f6-4852-b0a1-adf1034e8b6e
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 89319d02-0216-4cf6-a81d-76ead757fd16
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: fed66d58-5d55-4e5b-8ec3-10cd9229d3fb
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2d686010-7ac5-4447-b4f8-8e5ddfa19f86
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 85de0d02-f932-404c-8c87-aea5cabc3d63
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 939e2752-fed7-432b-9449-75076eea8d1e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4acef3a1-cf96-4653-a96d-6aae6508e76c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 1ea35976-995c-45e3-ad9c-dbf538096974
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: cef29139-222e-4251-9f33-e85f5aa639c4
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 0c130c82-efbf-4f31-9a9e-7fcbdfbee522
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 12e78d8f-b23a-45c6-a9fe-7090c538e6ea
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 9aca75a0-da81-41e2-a08c-0103e77e7096
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 30f62fc9-faf3-4812-9757-8aeb33c80bec
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 90162f87-ba25-415e-8d6b-1c9d48bd8c75
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: f45d9c2f-e92a-4b57-8870-6f9453aca357
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fdb35658-4131-4cd5-8675-269c86fa8b56
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 62bf3c7f-c946-4e91-82ad-29bdac43d0a5
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f5e66201-e9dd-4573-83c1-49611740185f
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 796b39fd-a1c7-4975-a80c-9958694b7c30
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 7c8616b2-352d-4589-bf2e-13a8cc887448
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: aebd5b40-3115-4522-8bf8-b30868a8a88c
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 8da72edd-39ad-4d3b-a434-92b4a41f6778
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: e34403c2-a010-4e1b-ba56-3a541ff79af5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 177bb159-7061-4f23-b1d0-85707d59979c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: e9f0eeef-daa3-49ab-9657-715a24e2dac5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: ff6c8809-2852-4a10-9ed1-385d20e2a899
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 6d7c24f1-b185-4c91-80d3-c0358599a4ba
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 58065b3e-f177-40b9-8d41-cab40679f5cb
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a10f7445-ef2d-477e-bb71-a9678af59dea
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 4f23a17c-02a9-4202-8b0d-ac27b11d0010
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: d5fb266e-3fd2-4cba-a06f-8cd8f2ae18c1
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: bd8b5da6-fd99-47f9-ae8d-f0451219c78c
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2fa95a58-f837-4c01-a2a5-750bfcae86b5
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 88884880-ab7d-4967-8fdd-abac9341c930
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 939b6726-9ed2-4d6b-b72b-4c0c47fdfc5f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 57787e32-6385-4d99-b809-38ff00dfc0ff
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 51fed4dc-9489-4de3-aa5c-1a8a87219638
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 61cf1430-7136-4bde-a4f8-ce21725036b5
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 8df7e372-02b8-4d60-a5af-eae8d82c8ca4
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: 6c913a7c-f1d1-4277-832d-5c89ef6d5e86
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: d3c7164e-fc51-46e4-ae2f-f6b20b152644
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 3af67bea-bcbe-4b25-aba6-ccd1731c621e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 889c973a-9425-4b0d-a8ff-a9a85d18726f
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 42a9af98-0832-45d8-93f0-4a36a60afec0
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 04f8091e-ed26-4ef7-ac76-a997ca83d5a2
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 523c25a7-ef70-45bf-84d7-faa1f1dc1c90
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 527fb3bb-95fe-4683-b432-a7613a851480
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 8096a5da-fdef-44a2-a975-ad459d899c54
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 4ddd621c-c1a3-44ae-b875-9c2887be8226
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: f7801517-3f14-46de-9133-9a806261bdf7
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 0929a3b3-1b16-4f0a-9590-d8f141292a15
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 5f372b60-d610-4235-bab8-45dbdb5de37b
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 36874d37-4b10-412d-8c10-45a075d3dfd3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 502a666c-b692-49b0-9437-71af1b8cde05
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 32120274-6f3e-4117-9e9c-7416946b6d38
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: c3410a4d-00b2-4f19-91c6-c9caef6a5573
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: a45892e8-6209-4b4c-9bd3-b5005a3dc904
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 1eaf14c4-c8a7-4b66-b248-e7dd3700be4c
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 012e53ce-9292-4b60-9cd1-e43c903b1e86
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8f3b1ae7-6a79-4a4b-96af-a18c679099b5
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 1a62f813-20d1-46f7-9d84-d468e557880e
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c59daf2d-1eb1-4be1-9050-75c64d3842c3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 6b16ec4f-9c9c-4baa-9bf2-800acf481d34
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 7ce2c2a9-39e9-4b40-b695-44e9ecc541b6
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 64213cf7-e3b6-4891-9c4f-64fefe14e892
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 385303c6-d358-4e67-8fed-cab495c2f904
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: d18aba64-6d1d-433c-8cad-c767c082fac7
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: a186ecec-54cb-4b10-a6de-82e8f1b32c7d
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 8a51d3ae-28ee-45f9-9657-84b88e4c1ac7
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 0645b885-3651-4d82-9e1b-2fcf2a4b6086
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: d0aee986-4ad3-43ef-aeae-bd3fcbdffbf9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 8d13502b-9ae2-4395-af27-c88dcfabe27d
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: f1b25576-8e4e-4e8a-804b-113f7f9de13d
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 27f8a867-fa6b-4798-8791-1562f21f48a7
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 47fc4fe6-3f12-46a9-abcd-ad28c3ad166e
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 61890d70-d9c2-44a1-a281-010015d8c914
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 2b486928-795a-47e8-905a-cead3baa80e2
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 27a593e2-ba37-4d41-9a25-126debf9233b
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 31d1d3a2-d22a-4bfa-b38f-573d951a0f27
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 86cf493a-60ee-424d-84c7-64c7c4bfcd88
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f058b887-76cd-43c3-9f66-80c6ebbe40f6
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: bbdb9d0e-267b-4f64-ad39-8ea6a3656a2b
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: cdc27869-eed4-45dd-a867-f915b7100d6f
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 9543fe14-4d18-40da-ac67-3febb866dc61
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 9c048ab6-9077-4c3b-be64-8feb67f4808d
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: c9fb8194-6037-4ad0-8c63-ee5b0940e783
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: c365a729-316d-402b-89c5-dd176047a66f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 833f3f8a-99af-4f50-82e3-4a01d3a5148a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 8edb73bf-7ff2-41a7-a2b9-4e8196d52287
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: bd86c4f6-5941-4ad4-8158-da255c0b5404
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: ec47bcfd-df7e-43ae-8d12-54afa5cc47e1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 76a7adbb-6984-4a2d-9ecb-ca9c1f55afa1
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 7fd7f0c8-a2e9-4a49-8811-8fd3df8900d3
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 7987c074-e54d-4994-acaf-f7b58f75f194
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 91d6524c-d5d5-47be-b354-396a45fd1e3a
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: d134cc7f-9585-4c97-b562-d1368d1121aa
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 06937932-4559-4921-ac8a-e25e121f0c27
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 065f7945-473d-4ba9-9c23-1dd438a7ad1a
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 386cf37f-4e2e-4862-adfb-491a152545c1
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aa451f6-ecd6-422b-a27d-10c6827312cd
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 0b18c850-a36d-48ee-988c-31f527b1b6e2
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 989dbbe1-c0db-4e7d-9629-046b48354c3e
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 3e2940c5-3b2a-4e4d-8874-30440306c77b
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3bf4bea6-c3f3-48e7-a556-9c98e7cf8cac
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 0af2e6ba-9575-4db4-bb1b-778fafa47524
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 7c8c3323-eced-4626-bfe7-b7a4e823f196
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: c78f0400-a84d-411a-94f0-f474b72fc0c3
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: b210fffd-4633-44ef-b851-b3b0e77c1aac
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: d4be68ad-a25b-4344-9d2e-064fcac4b1e6
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 62733ce6-b36c-4376-908f-f6b8ed0d9d76
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f630474b-01e2-4dda-89da-55e83d4a6d90
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 15d955f6-a5ae-4e78-af13-401e8477485f
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: c61db1a2-ed6b-437d-8d8c-e849e09e2f28
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 2cc7b23b-28b8-4ef2-885b-acfd5728a1ec
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 1416de9e-01d5-4f86-bc84-c9b53e355792
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 95f662a4-1af3-4a98-b3d0-71b6a1acaa4b
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 5fa7c560-ec53-47d4-84ff-ce1c9567e2ca
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 40729aa0-b6a8-4228-b2ae-dd6c9ded7a0e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 4c4ff155-4176-4290-bec7-ac5829d42913
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 96e4507c-ffe7-4b34-bbfa-ae5dd4ded72d
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: 59309414-8113-4582-a135-36ab6ba3d445
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: f57886da-9234-4c1e-a5b4-d424b7f76790
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 90e6a810-8c35-4e33-baf0-6ff552462c73
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: e7a14eaa-fcae-42c8-9566-0200bc2d8d7f
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 431853ce-3436-4c66-8f87-ad85e657a5e3
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 1061c628-2a3b-40f1-9736-8e49d485ae8d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 9764b18d-9e0a-4642-8a7b-ab4b300e5e54
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 670d0940-3c37-48f1-a742-fead5fbf317d
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 74a2178f-6b8e-42ef-8147-369289cdbe0b
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: f722ceb8-fd59-46ef-89d6-89b7cf1c3dee
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 8e63664a-e9d7-46f9-a72b-e38a445474d9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 62652cbf-4af0-4273-9cae-1473c1574484
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8ac4201a-ee67-41e7-8c63-15b3b8482b6a
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: c79f3e6e-c34c-4a29-b3f7-34505f39880d
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: aa640a60-7cb2-4aeb-8b92-e0757df32da4
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: a4934bd9-faa6-470e-954b-5186b861a90e
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: f4cf459f-b6cf-4bcb-868c-c0357adbbf66
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 94e0c881-c574-4525-b02e-ee0930b8ab8c
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 3fb2c4d0-65eb-44a7-8e5c-4c8d32460d54
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: bd0df62e-cf76-4f4a-b593-58b651c50e78
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 1e09f429-5a20-4e15-9d05-b88d6f675c20
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: a374ed0b-929d-4f82-8ffc-61fdf0bd3291
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: c1a77564-0e90-4e19-a723-ff553e4c7640
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 249d7fd1-d7ee-41ed-8e03-902601fb9586
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 79ddea50-d900-4ce5-b582-886889f45904
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: f67b2076-266a-428e-b6c8-c275891e9a9e
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 8c93c13d-8dc6-42ae-9280-353ffc56bb73
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fbfc3a2b-1b7f-43ba-bc8e-7b40ef0ce6b4
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: e9703e8b-4d26-42b7-b420-4ed749400be9
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: ab83a080-6e3a-445c-8684-de4767f997df
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 5fde6e91-ed7e-427f-a62d-0f7db2fc0332
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: bcef86cb-b10f-43c4-a201-5398c5dbafbb
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: 8a62a414-892e-4325-809d-1461b9582486
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 964dff9e-bb88-44a1-a27b-b1c14fc938a5
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: cf1f83e7-2300-4772-8417-e50f8be6676d
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 0aaf79ee-a716-470e-9431-df2c8192d7d5
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 03bc1fd7-90a6-408c-9210-3adc4b6a0915
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 60be9df7-b2d5-4faf-a76c-c836301f85c0
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 17896f0f-9f59-45c6-b905-8ad4239f6d71
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 3eedb5da-a8f6-4637-bb44-a378d5414c6f
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 8beb01e1-0a70-43d0-bfd3-0fc34789c7db
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 2dad3a9e-40a6-49ac-8642-5f855f667841
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 105f9326-5da8-4116-8ebd-8d65480c0214
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 47d2099d-b8b0-425a-a5cd-391b879ece64
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: a0639ca1-09c6-49b2-8874-45cb58995829
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: aa75e20c-825c-4cc2-b8bb-c159e9258bb9
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 441c14de-32a9-4dda-97bf-0e1bf87df6e7
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: df41c7e3-5fa1-4c84-aef4-78e666c2bac8
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: 59d513fb-668d-4bfb-b56b-9e238ad04a5b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 63758635-cf75-444d-97f4-dd7543ade9ea
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: affab443-ec66-42c0-868a-b5e9eecf79e6
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: d9cc0162-b872-4507-8b96-4eefd9d87fc4
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: af9e18af-ad54-4487-bdd0-88b20632361c
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: 04fcf9eb-7feb-47e8-8f84-583ebccdb068
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 60b8629d-0260-46fc-8262-c54d6181cff7
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: fadeabbf-37a0-4c6c-8ed9-175ba4e338ca
    content: Fix 'File for Myself' to use verified PAN from user profile (user?.panVerified) instead of API call
    status: completed
  - id: a5083537-a9e1-416a-b456-dcce886db392
    content: Improve PAN status checking logic to prioritize profile data over API calls
    status: completed
  - id: 2c7ae013-5b39-41d7-9d86-be29571b9295
    content: Enhance family member selection with proper PAN verification status display and handling
    status: completed
  - id: 540b8ceb-3204-4c25-8f4e-cd413fe68e59
    content: Fix family member PAN verification flow to show inline verification when needed
    status: completed
  - id: df059642-3745-4de8-9e36-eaffa0b57d75
    content: "Handle all edge cases: no PAN, unverified PAN, verified PAN, no family members, newly added members"
    status: completed
  - id: e35bb2f6-2228-4b93-a6c0-487e0e4fa191
    content: Improve UI/UX with loading states, visual indicators, empty states, and error handling
    status: completed
  - id: 8e15f194-a31d-477f-b6ba-caeba317bb10
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: aab5cd4f-d9d5-43b0-8747-a15cb027f4bb
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
  - id: 05b328a2-0f2f-41d9-b292-a2e44c85473c
    content: Extract dateOfBirth from SurePass API response in PANVerificationService
    status: completed
  - id: 4159d2fa-9632-4f05-a64e-f064fdd339a9
    content: Include dateOfBirth in PAN verification API response
    status: completed
  - id: baa5281f-72b6-49e8-87f3-ee8806697b9b
    content: Auto-populate DOB in ProfileTab when PAN is verified (only if DOB is empty)
    status: completed
  - id: 799e96a9-3456-431a-ad2a-f879b4ce6da9
    content: Fix form state management for PAN changes, clears, and reverts
    status: completed
  - id: 4612f300-e9e8-428c-8420-aa4136d7b4ef
    content: Improve save button logic and validation for PAN verification requirement
    status: completed
  - id: 0c2413e6-b06b-49b3-a259-4180b61db9b7
    content: Enhance error handling and user feedback for all edge cases
    status: completed
  - id: 3fa7e0b1-5918-4597-a79f-48a7faa602b2
    content: Refresh user data after successful save to show updated PAN status
    status: completed
  - id: f650e6f7-acea-4d93-9b35-bb135b418a1d
    content: Remove duplicate 'Verify PAN' button from ProfileSettings and auto-show PANVerificationInline component
    status: completed
  - id: 29d1926a-c09d-41ce-bf3f-0ccb0cdb9291
    content: Add PATCH method to CORS allowed methods in backend
    status: completed
---

# Phase 3: Profile Settings Improvements

## Overview

Implement critical improvements for Profile Settings page based on audit findings. Focus on replacing mock data with real API integrations and adding missing validations.

---

## Part 1: Bank Accounts Tab Integration

### 1.1 Create Bank Accounts API Endpoints

**Current State:**
- Bank Accounts tab uses hardcoded mock data
- No API endpoints exist for managing user bank accounts

**Implementation:**
- Create backend endpoints for bank account management:
  - `GET /api/users/bank-accounts` - Get user's bank accounts
  - `POST /api/users/bank-accounts` - Add new bank account
  - `PUT /api/users/bank-accounts/:id` - Update bank account
  - `DELETE /api/users/bank-accounts/:id` - Delete bank account
  - `PATCH /api/users/bank-accounts/:id/set-primary` - Set primary account

**Files to Create/Modify:**
- `backend/src/routes/user.js` - Add bank accounts routes
- `backend/src/controllers/UserController.js` - Add bank account methods

**Expected Endpoint Structure:**
```javascript
// GET /api/users/bank-accounts
{
  success: true,
  data: [
    {
      id: 1,
      bankName: 'HDFC Bank',
      accountNumber: '****1234', // Masked
      fullAccountNumber: '12345678901234', // Only for display when needed
      ifsc: 'HDFC0001234',
      accountHolderName: 'John Doe',
      accountType: 'savings', // savings, current
      isPrimary: true,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  ]
}
```

### 1.2 Create Bank Account Service (Frontend)

**Implementation:**
- Create `frontend/src/services/api/bankAccountService.js`
- Implement methods: `getBankAccounts()`, `addBankAccount()`, `updateBankAccount()`, `deleteBankAccount()`, `setPrimaryAccount()`
- Use existing `apiClient` pattern

**Files to Create:**
- `frontend/src/services/api/bankAccountService.js`

### 1.3 Integrate Bank Accounts API in BankAccountsTab

**Current State:**
- Uses hardcoded mock data in `useState`
- "Add Bank Account" button doesn't work

**Implementation:**
- Replace mock data with React Query hook
- Add loading and error states
- Implement "Add Bank Account" form/modal
- Add edit and delete functionality
- Add set primary account functionality
- Use skeleton loader during loading

**Files to Modify:**
- `frontend/src/pages/User/ProfileSettings.js` - Update BankAccountsTab component

**Key Changes:**
```javascript
// Replace mock data with API call
const { data: bankAccounts, isLoading, error, refetch } = useQuery(
  'bankAccounts',
  () => bankAccountService.getBankAccounts(),
  { refetchOnWindowFocus: false }
);

// Add bank account form/modal
const [showAddForm, setShowAddForm] = useState(false);
```

---

## Part 2: Filings Tab Integration

### 2.1 Integrate Filings API in FilingsTab

**Current State:**
- Uses hardcoded mock data
- API endpoint exists (`itrService.getUserITRs()`)

**Implementation:**
- Replace mock data with `itrService.getUserITRs()` call
- Use React Query for data fetching
- Add loading and error states
- Format filing data properly (assessment year, status, refund amount)
- Add navigation to filing details
- Use skeleton loader during loading

**Files to Modify:**
- `frontend/src/pages/User/ProfileSettings.js` - Update FilingsTab component

**Key Changes:**
```javascript
// Replace mock data with API call
const { data: filingsData, isLoading, error } = useQuery(
  'userFilings',
  () => itrService.getUserITRs(),
  { refetchOnWindowFocus: false }
);

// Transform API data to match display format
const filings = filingsData?.data?.filings?.map(filing => ({
  id: filing.id,
  year: filing.assessmentYear,
  status: filing.status,
  refund: filing.refundAmount || 0,
  date: filing.filingDate || filing.createdAt,
  itrType: filing.itrType,
}));
```

---

## Part 3: Phone Format Validation

### 3.1 Add Frontend Phone Validation

**Current State:**
- Phone input exists but no format validation on frontend
- Backend validates phone format

**Implementation:**
- Add phone format validation in ProfileTab
- Validate on blur and before submit
- Show inline error message for invalid format
- Use same validation as signup: 10 digits, starts with 6-9
- Normalize phone input (remove non-digits)

**Files to Modify:**
- `frontend/src/pages/User/ProfileSettings.js` - Update ProfileTab component

**Validation Function:**
```javascript
const validatePhone = (phone) => {
  if (!phone) return { isValid: true }; // Optional field
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }
  if (!/^[6-9]/.test(phoneDigits)) {
    return { isValid: false, error: 'Phone number must start with 6, 7, 8, or 9' };
  }
  return { isValid: true };
};
```

---

## Part 4: Address Fields (Optional Enhancement)

### 4.1 Add Address Fields to Profile Tab

**Current State:**
- No address fields in profile

**Implementation:**
- Add address, city, state, pincode fields to ProfileTab
- Update formData state
- Update API call to include address fields
- Add validation for pincode (6 digits)

**Files to Modify:**
- `frontend/src/pages/User/ProfileSettings.js` - Update ProfileTab component
- `backend/src/controllers/UserController.js` - Update profile update to handle address fields

**Note:** This is optional and can be deferred if not critical.

---

## Implementation Priority

### Critical (P0) - Must Fix
1. Bank Accounts API integration
2. Filings API integration
3. Phone format validation

### High Priority (P1) - Fix Soon
1. Bank account add/edit/delete functionality
2. Error handling for API failures
3. Loading states and skeleton loaders

### Medium Priority (P2) - Nice to Have
1. Address fields
2. Set primary bank account functionality
3. Bank account form validation

---

## Testing Checklist

- [ ] Bank accounts load from API
- [ ] Add bank account form works
- [ ] Edit bank account works
- [ ] Delete bank account works
- [ ] Set primary account works
- [ ] Filings load from API
- [ ] Filing navigation works
- [ ] Phone validation works on frontend
- [ ] Phone validation error messages display correctly
- [ ] Loading states show skeleton loaders
- [ ] Error states display properly
- [ ] Empty states display when no data

---

## Success Criteria

- Bank Accounts tab shows real data from API
- Filings tab shows real data from API
- Phone format validated on frontend before submission
- All API calls handle errors gracefully
- Loading states provide good UX
- Empty states guide users to add data