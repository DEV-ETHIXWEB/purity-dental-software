"use client";

import { useState } from "react";
import { Phone, Mail, Pencil, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SamplePatient } from "@/lib/sample-data";

export function ContactDetailsCard({ patient }: { patient: SamplePatient }) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(patient.phone);
  const [email, setEmail] = useState(patient.email);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Details</CardTitle>
        {!editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            aria-label="Edit contact details"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              aria-label="Save contact details"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPhone(patient.phone);
                setEmail(patient.email);
                setEditing(false);
              }}
              aria-label="Cancel editing contact details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing ? (
          <>
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              <span className="text-text-primary">{phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              <span className="text-text-primary">{email}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
