# BurnBlack Design System - Component Library

## Overview

A comprehensive, accessible design system built with React following Atomic Design methodology.

---

## Design Tokens

All components use centralized design tokens for consistency:

```javascript
import { tokens } from './styles/tokens';

// Colors
tokens.colors.accent[600]  // BurnBlack Gold
tokens.colors.primary[900] // Deep Slate
tokens.colors.success[600] // Success Green

// Typography
tokens.typography.fontSize.base  // 16px
tokens.typography.fontWeight.semibold  // 600

// Spacing
tokens.spacing.md  // 16px
tokens.spacing.lg  // 24px
```

---

## Components

### Atoms

#### Button
```jsx
import { Button } from './components';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Sizes**: `sm`, `md`, `lg`  
**Props**: `loading`, `disabled`, `fullWidth`

#### Input
```jsx
import { Input } from './components/atoms/Input';

<Input
  type="text"
  placeholder="Enter PAN"
  error={hasError}
  leftIcon={<SearchIcon />}
/>
```

**Props**: `error`, `success`, `leftIcon`, `rightIcon`, `fullWidth`

#### Card
```jsx
import { Card } from './components/atoms/Card';

<Card variant="elevated" padding="lg" hoverable>
  Content here
</Card>
```

**Variants**: `default`, `elevated`, `outlined`, `flat`  
**Padding**: `none`, `sm`, `md`, `lg`, `xl`

#### Badge
```jsx
import { Badge } from './components/atoms/Badge';

<Badge variant="success" dot>
  Verified
</Badge>
```

**Variants**: `default`, `primary`, `accent`, `success`, `warning`, `error`, `info`

---

### Molecules

#### FormField
```jsx
import { FormField } from './components/molecules/FormField';
import { Input } from './components/atoms/Input';

<FormField
  label="PAN Number"
  required
  error={errors.pan}
  hint="Enter your 10-digit PAN"
>
  <Input value={pan} onChange={setPan} />
</FormField>
```

#### OTPInput
```jsx
import { OTPInput } from './components/molecules/OTPInput';

<OTPInput
  length={6}
  value={otp}
  onChange={setOtp}
  onComplete={handleVerify}
  error={hasError}
/>
```

**Features**:
- Auto-focus next digit
- Paste support
- Keyboard navigation (arrows, backspace)
- Mobile-friendly

#### UploadZone
```jsx
import { UploadZone } from './components/molecules/UploadZone';

<UploadZone
  onUpload={handleFiles}
  accept=".pdf"
  maxSize={10 * 1024 * 1024}
  multiple
/>
```

**Features**:
- Drag and drop
- File validation
- Size limits
- Preview uploaded files

---

### Organisms

#### FilingEntrySelector
```jsx
import { FilingEntrySelector } from './components/organisms/FilingEntrySelector';

<FilingEntrySelector
  onSelect={handleMethodSelect}
  verifiedPansCount={2}
/>
```

**Features**:
- Three entry methods (Upload, Verified, Manual)
- Recommended badge
- Disabled state for no verified PANs
- Responsive design

---

## Usage Examples

### Complete Form
```jsx
import { FormField, Input, Button } from './components';

function PANForm() {
  const [pan, setPan] = useState('');
  const [error, setError] = useState('');

  return (
    <form>
      <FormField
        label="PAN Number"
        required
        error={error}
        hint="10-character alphanumeric"
      >
        <Input
          value={pan}
          onChange={(e) => setPan(e.target.value)}
          error={!!error}
          fullWidth
        />
      </FormField>

      <Button variant="primary" fullWidth>
        Verify PAN
      </Button>
    </form>
  );
}
```

### File Upload Flow
```jsx
import { Card, UploadZone, Button } from './components';

function Form16Upload() {
  const [files, setFiles] = useState([]);

  return (
    <Card padding="lg">
      <h2>Upload Form 16</h2>
      <UploadZone
        onUpload={setFiles}
        accept=".pdf"
        multiple
      />
      {files.length > 0 && (
        <Button variant="primary" fullWidth>
          Continue with {files.length} file(s)
        </Button>
      )}
    </Card>
  );
}
```

---

## Accessibility

All components follow WCAG AA standards:

- ✓ Keyboard navigation
- ✓ Screen reader support (ARIA labels)
- ✓ Focus indicators
- ✓ Color contrast ratios > 4.5:1
- ✓ Touch targets ≥ 48px

---

## Theming

Components use CSS custom properties for easy theming:

```css
:root {
  --color-accent-600: #D4AF37;  /* Change brand color */
  --font-primary: 'Your Font', sans-serif;
}
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS 13+, Android 8+

---

## Next Steps

1. **Week 4**: Create Figma mockups using these components
2. **Week 5**: Build complete filing flow
3. **Future**: Add more organisms (TaxCalculator, IncomeForm, etc.)
