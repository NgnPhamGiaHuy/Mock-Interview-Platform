import React from "react"

import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: "text" | "email" | "password" | "file";
}

const FormField = <T extends FieldValues>({ control, name, label, placeholder, type = "text" }: FormFieldProps<T>) => (
    <Controller name={name} control={control} render={({ field }) => (
        <FormItem>
            <FormLabel className={"label"}>{ label }</FormLabel>
            <FormControl>
                <Input placeholder={placeholder} type={type} className={"input"} {...field} />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
    />
)

export default FormField;
