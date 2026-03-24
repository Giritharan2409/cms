export function SectionContainer({ title, subtitle, children }) {
  return (
    <section className="settings-panel">
      {title ? <h2>{title}</h2> : null}
      {subtitle ? <p className="settings-panel-subtitle">{subtitle}</p> : null}
      {children}
    </section>
  );
}

export function Card({ title, children }) {
  return (
    <div className="settings-subcard">
      {title ? <h3 className="settings-subcard-title">{title}</h3> : null}
      {children}
    </div>
  );
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  as = 'input',
  type = 'text',
  readOnly = false,
  placeholder,
  rows = 3,
  spanTwo = false,
}) {
  const fieldClassName = spanTwo ? 'settings-field settings-col-span-2' : 'settings-field';

  function handleChange(event) {
    onChange?.(event.target.value, event);
  }

  return (
    <div className={fieldClassName}>
      <label htmlFor={id}>{label}</label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variantClass = variant === 'muted' ? 'settings-btn-muted' : 'settings-btn-primary';
  const composedClassName = `settings-btn ${variantClass}${className ? ` ${className}` : ''}`;

  return (
    <button type="button" className={composedClassName} {...props}>
      {children}
    </button>
  );
}

export function ProfileAvatar({
  photo,
  alt,
  initials,
  inputRef,
  onFileChange,
  buttonLabel = 'Choose Photo',
  fileName,
}) {
  return (
    <>
      <div className="settings-photo-row">
        <div className="settings-photo-avatar">
          {photo ? (
            <img src={photo} alt={alt} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onFileChange}
        />
        <button
          type="button"
          className="settings-upload-btn"
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </button>
      </div>
      {fileName ? <p className="settings-file-name">Current: {fileName}</p> : null}
    </>
  );
}

export function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <article className="settings-toggle-item">
      <div className="settings-toggle-copy">
        <strong>{label}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      <label className="settings-toggle">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
        <span className="settings-toggle-slider" />
      </label>
    </article>
  );
}
