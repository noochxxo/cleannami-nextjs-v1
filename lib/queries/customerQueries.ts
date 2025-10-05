import { db } from "@/db";
import { customers, jobs, properties, subscriptions } from "@/db/schemas";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";


export async function getCustomerDetails(customerId: string) {
  // Step 1: Fetch the core customer details.
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  });

  if (!customer) {
    notFound(); // Customer not found, show a 404 page.
  }

  // Step 2: Fetch all properties related to this customer.
  const customerProperties = await db.query.properties.findMany({
    where: eq(properties.customerId, customerId),
  });
  
  // Step 3: Fetch all subscriptions related to this customer.
  const customerSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.customerId, customerId),
      with: {
          property: { columns: { address: true } } // Still need the property address for subscriptions
      }
  });

  // Step 4: Fetch all jobs related to the customer's properties.
  let customerJobs: any[] = [];
  if (customerProperties.length > 0) {
    const propertyIds = customerProperties.map(p => p.id);
    customerJobs = await db.query.jobs.findMany({
      where: inArray(jobs.propertyId, propertyIds),
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
      with: {
        property: {
          columns: {
            address: true,
          },
        },
      },
    });
  }

  // Step 5: Combine all the data into a single object.
  return {
    ...customer,
    properties: customerProperties,
    subscriptions: customerSubscriptions,
    jobs: customerJobs,
  };
}

// The type definition remains the same, ensuring compatibility with your components.
export type CustomerDetails = Awaited<ReturnType<typeof getCustomerDetails>>;

