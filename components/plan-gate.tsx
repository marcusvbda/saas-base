'use client';
import { ReactNode } from 'react';

interface IProps {
	children: ReactNode;
}

export default function PlanGate({ children }: IProps) {
	return children;
}
