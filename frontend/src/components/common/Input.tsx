'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  description?: string
  error?: string
  success?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      description,
      error,
      success,
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputType = showPasswordToggle && showPassword ? 'text' : type

    const baseClasses = 'block border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary disabled:opacity-50 disabled:cursor-not-allowed'
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    }

    const getInputClasses = () => {
      let classes = clsx(
        baseClasses,
        sizes[size],
        fullWidth ? 'w-full' : '',
        leftIcon ? 'pl-10' : '',
        (rightIcon || showPasswordToggle || error || success) ? 'pr-10' : ''
      )

      if (error) {
        classes += ' border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 focus:ring-red-500 focus:border-red-500'
      } else if (success) {
        classes += ' border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 focus:ring-green-500 focus:border-green-500'
      } else if (isFocused) {
        classes += ' border-purple-primary bg-background-primary text-text-primary focus:ring-purple-primary focus:border-purple-primary'
      } else {
        classes += ' border-border bg-background-primary text-text-primary hover:border-purple-primary focus:ring-purple-primary focus:border-purple-primary'
      }

      return clsx(classes, className)
    }

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-1">
            {label}
          </label>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-text-secondary mb-2">
            {description}
          </p>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-text-secondary">
                {typeof leftIcon === 'string' ? (
                  <span style={{ fontSize: iconSize }}>{leftIcon}</span>
                ) : (
                  leftIcon
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={getInputClasses()}
            disabled={disabled}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* Password Toggle */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
              </button>
            )}

            {/* Success Icon */}
            {success && !showPasswordToggle && (
              <CheckCircle size={iconSize} className="text-green-500" />
            )}

            {/* Error Icon */}
            {error && !showPasswordToggle && (
              <AlertCircle size={iconSize} className="text-red-500" />
            )}

            {/* Custom Right Icon */}
            {rightIcon && !showPasswordToggle && !error && !success && (
              <div className="text-text-secondary">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className="mt-1 text-sm text-green-500 flex items-center gap-1">
            <CheckCircle size={14} />
            {success}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input