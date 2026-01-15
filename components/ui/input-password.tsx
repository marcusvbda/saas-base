'use client';

import { ComponentProps, useState } from 'react';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from './input-group';
import { EyeOffIcon, EyeIcon } from 'lucide-react';

export function InputPassword({
	value = '',
	onChange = null,
	className = '',
	placeholder = '',
	...props
}: ComponentProps<'input'> & { onChange?: any; value?: string }) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<InputGroup className={className}>
			<InputGroupInput
				value={value}
				onChange={onChange}
				type={showPassword ? 'text' : 'password'}
				placeholder={placeholder}
				{...props}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					className="cursor-pointer"
					size="icon-xs"
					onClick={() => {
						setShowPassword(!showPassword);
					}}
				>
					{showPassword ? (
						<EyeOffIcon className="w-4 h-4" />
					) : (
						<EyeIcon className="w-4 h-4" />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}
