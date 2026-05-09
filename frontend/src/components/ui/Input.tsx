import { memo, type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string | boolean
    helperText?: string
}

const InputInner = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
        const hasError = !!error || !!helperText
        const displayError = typeof error === 'string' ? error : helperText

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`block w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'} ${className} `}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${inputId}-error` : undefined}
                    {...props}
                />
                {displayError && (
                    <p id={`${inputId}-error`} role="alert" className="mt-1 text-sm text-red-500">
                        {displayError}
                    </p>
                )}
            </div>
        )
    },
)

InputInner.displayName = 'Input'
export const Input = memo(InputInner)
