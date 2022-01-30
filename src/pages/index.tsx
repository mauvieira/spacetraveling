import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link'
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from "react-icons/fi";
import { getPrismicClient } from '../services/prismic';
import { formatDate } from '../util/formatDate';

import Header from "../components/Header";

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {
  const { postsPagination: { results, next_page } } = props;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string | null>(next_page);

  const handleLoadMore = async () => {
    const response = await fetch(nextPage);
    const responseJson = await response.json();
    const newPosts = [...posts, ...responseJson.results];

    setNextPage(responseJson.next_page);
    setPosts(newPosts);
  }

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        {posts.map(({ data: { author, subtitle, title }, uid, first_publication_date }) => (
          <article className={styles.post} key={uid}>
            <Link href={`/post/${uid}`}>
              <a>
                <h2>{title}</h2>
                <p>{subtitle}</p>
                <div className={styles.info}>
                  <span><FiCalendar /> {formatDate(first_publication_date)}</span>
                  <span><FiUser /> {author}</span>
                </div>
              </a>
            </Link>
          </article>
        ))}

        {nextPage && <button onClick={handleLoadMore} className={styles.loadMore}>Load more posts</button>}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: postsResponse
    }
  }
};
