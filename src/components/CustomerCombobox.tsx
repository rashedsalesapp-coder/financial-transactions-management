'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { debounce } from 'lodash'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Customer {
  customer_id: string;
  full_name: string;
}

export function CustomerCombobox({ selectedCustomer, onSelectCustomer }: { selectedCustomer: Customer | null, onSelectCustomer: (customer: Customer | null) => void }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    const { data } = await supabase
      .from('customers')
      .select('customer_id, full_name')
      .or(`full_name.ilike.%${query}%,civil_id.ilike.%${query}%,phone_1.ilike.%${query}%`)
      .limit(10);
    setCustomers(data || []);
  }, 500), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCustomer ? selectedCustomer.full_name : "ابحث عن عميل..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="ابحث بالاسم، الرقم المدني، أو الهاتف..." onValueChange={setSearchQuery}/>
          <CommandList>
            <CommandEmpty>لا يوجد عملاء.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.customer_id}
                  value={customer.full_name}
                  onSelect={() => {
                    onSelectCustomer(customer);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.customer_id === customer.customer_id ? "opacity-100" : "opacity-0")}/>
                  {customer.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
